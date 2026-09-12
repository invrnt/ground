import { createHash,randomBytes,randomUUID,timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { PurchaseList } from '@ground/contracts';
import { GroundError, operationProposalSchema, interpretationResultSchema, operationResultSchema, type ActorContext, type Clarification, type Job, type JobQueue, type OperationResult, type PrivateFileStore, type ProjectRepository, type SiteCommandService, type TransactionContext } from '@ground/contracts';
import type { PgTransactions } from '../../infra/database';
import { permissions } from '../../infra/sessions';
import { ingestionJob,type AuthorizedReplyRouter,type IngestionRepository,type IngestionService,type StoredInput } from '../ingestion';
import type { OpenRouterReportAdapter } from '../../adapters/openrouter/openrouter-adapter';
import { InterpretationRepository,type InterpretationRecord } from './repository';
import { assertExtraction,resolveCommand } from './resolve-extraction';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export interface QueryPort { answer(context:ActorContext,question:string):Promise<{text:string}>; }
export class InterpretationWorkflow implements AuthorizedReplyRouter {
 constructor(private readonly deps:{transactions:PgTransactions;repository:InterpretationRepository;intake:IngestionRepository;replies:IngestionService;projects:ProjectRepository;commands:SiteCommandService;queue:JobQueue;files:PrivateFileStore;adapter:OpenRouterReportAdapter;purchases?:{list(context:ActorContext,tx?:TransactionContext):Promise<PurchaseList>};queries?:QueryPort}){}
 async transcriptForInput(context:ActorContext,inputId:string,tx?:TransactionContext):Promise<string|null>{if(!tx)return this.deps.transactions.run(current=>this.transcriptForInput(context,inputId,current));await this.deps.projects.snapshot(context,tx);const row=await this.deps.repository.get(inputId,tx);if(row&&(row.project_id!==context.project_id||row.run_id!==context.run_id))throw new GroundError('FORBIDDEN','Transcript access denied');return row?.transcript??null;}
 private async source(id:string,tx:TransactionContext){const input=await this.deps.intake.getInput(id,tx);const actor=await this.deps.intake.authorize(input.message.chat_id,input.message.sender_id,new Date().toISOString(),tx);if(actor.run_id!==input.message.run_id)throw new GroundError('CONFLICT','Input run retired');actor.permissions=permissions(actor.roles);return {input,actor};}
 async process(job:Job):Promise<void>{
   const {transactions,repository,adapter,files}=this.deps;
   const initial=await transactions.run(async tx=>{
     const {input,actor}=await this.source(job.payload.subject_id,tx);
     if(input.message.project_id!==job.project_id||input.message.run_id!==job.run_id)throw new GroundError('FORBIDDEN','Input scope mismatch');
     const stored=await repository.get(input.id,tx);
     if(stored&&['completed','ignored','needs_input'].includes(stored.status))return null;
     const record:InterpretationRecord=stored??{input_id:input.id,project_id:actor.project_id,run_id:actor.run_id,status:'processing',transcript:null,transcript_reference:null,result:null,metadata:{},error:null,question_count:0,answer_text:null};
     record.status='processing';await repository.save(record,tx);
     const linked=await repository.linkedMedia(input,tx);
     input.message={...input.message,media:linked};
     const snapshot=await this.deps.projects.snapshot(actor,tx);const purchases=this.deps.purchases?(await this.deps.purchases.list(actor,tx)).purchases:[];
     return {input,actor,record,context:{...snapshot,purchases}};
   });
   if(!initial)return;
   const {input,actor,record}=initial;
   try{
     if(record.transcript===null){
       const texts:string[]=[];
       for(const media of input.message.media.filter(media=>media.kind==='audio')){
         const audio=await adapter.transcribeAudio(await files.read(media.id));const derivativeId=randomUUID();const digest=createHash('sha256').update(audio.derivative).digest('hex');
         await files.put({id:derivativeId,bytes:audio.derivative,content_type:'audio/wav',sha256:digest});
         texts.push(audio.text);record.metadata[`transcription:${media.id}`]={...audio.metadata,source_id:media.id,derivative_id:derivativeId,derivative_sha256:digest};
         await transactions.run(async tx=>{await this.deps.intake.assertActive(actor.project_id,actor.run_id,tx);await repository.derivative(actor,derivativeId,digest,audio.derivative.byteLength,tx);});
       }
       record.transcript=texts.join('\n');record.transcript_reference=texts.length?randomUUID():null;
       await transactions.run(tx=>repository.save(record,tx));
     }
     const extracted=record.result?{extraction:record.result,metadata:record.metadata['interpretation']}:await adapter.interpretReport({message:input.message,context:initial.context,transcript:record.transcript,answer:record.answer_text});
     record.result=extracted.extraction;record.metadata['interpretation']=extracted.metadata;
     assertExtraction(extracted.extraction,[input.message.text,record.transcript,record.answer_text].filter(Boolean).join('\n'));
     if(extracted.extraction.irrelevant){record.status='ignored';await transactions.run(tx=>repository.save(record,tx));return;}
     if(extracted.extraction.query_intent){
       if(!this.deps.queries)throw new GroundError('NOT_READY','La consulta espera el servicio de reportes.');
       const answer=await this.deps.queries.answer(actor,extracted.extraction.query_intent);
       await transactions.run(async tx=>{await this.deps.intake.assertActive(actor.project_id,actor.run_id,tx);const existing=await repository.get(input.id,tx);if(existing?.status==='completed')return;record.status='completed';await repository.save(record,tx);await this.deps.replies.enqueueReply(input,answer.text,tx);});return;
     }
     await transactions.run(tx=>repository.save(record,tx));
     const errors:string[]=[...extracted.extraction.missing_fields];let pendingHandler=false;
     const outcomes=readOutcomes(record.metadata['command_outcomes']);
     let newIssue=outcomes.flatMap(item=>item.result.state_diff).find(diff=>diff.entity_type==='issue')?.entity_id??null;
     for(const [index,command]of extracted.extraction.commands.entries()){
       const prior=outcomes.find(item=>item.index===index);
       if(prior){if(prior.source_hash!==hash(JSON.stringify(command)))errors.push('La aclaración cambió un comando ya registrado. Solicita una corrección a supervisión.');continue;}
       try{
         const outcome=await transactions.run(async tx=>{
           await this.deps.intake.assertActive(actor.project_id,actor.run_id,tx);
           const current=await repository.get(input.id,tx);
           const committed=readOutcomes(current?.metadata['command_outcomes']).find(item=>item.index===index);
           if(committed)return committed;
           const context=await this.deps.projects.snapshot(actor,tx);
           const purchases=this.deps.purchases?(await this.deps.purchases.list(actor,tx)).purchases:[];
           const proposal=resolveCommand(command,context,[input.id,...input.message.media.map(media=>media.id)],(input.message.media.find(media=>media.kind==='document')??input.message.media.find(media=>media.kind==='photo'))?.sha256??null,newIssue,purchases);
           const result=await this.deps.commands.execute({context:actor,proposal,source_message_id:input.id,idempotency_key:`input:${input.id}:command:${index}:answer:${record.question_count}`},tx);
           if(!['applied','already_applied'].includes(result.status))throw new GroundError('VALIDATION_ERROR','El cambio necesita revisión. Confirma los datos y las existencias.');
           const item={index,source_hash:hash(JSON.stringify(command)),proposal,result};
           record.metadata['command_outcomes']=[...outcomes,item];await repository.save(record,tx);return item;
         });
         outcomes.push(outcome);record.metadata['command_outcomes']=outcomes;
         if(command.type==='report_issue')newIssue=outcome.result.state_diff.find(diff=>diff.entity_type==='issue')?.entity_id??null;
       }catch(error){
         if(error instanceof GroundError&&error.code==='NOT_READY'){pendingHandler=true;errors.push(error.message);}
         else if(error instanceof GroundError&&['VALIDATION_ERROR','CONFLICT','FORBIDDEN'].includes(error.code))errors.push('Confirma los datos del cambio pendiente y sus referencias.');
         else throw error;
       }
     }
     if(errors.length){
       if(pendingHandler){record.status='pending_handler';record.error='Hay cambios pendientes de un servicio todavía no registrado.';await transactions.run(tx=>repository.save(record,tx));throw new GroundError('NOT_READY',record.error);}
       await this.needsInput(input,actor,record,errors.slice(0,2));return;
     }
     await transactions.run(async tx=>{
       await this.deps.intake.assertActive(actor.project_id,actor.run_id,tx);
       const current=await repository.get(input.id,tx);if(current?.status==='completed')return;
       const context=await this.deps.projects.snapshot(actor,tx);
       record.status='completed';record.error=null;
       record.metadata['validated_result']=interpretationResultSchema.parse({transcript_reference:record.transcript_reference,operations:outcomes.map(item=>item.proposal),missing_fields:[],query_intent:null,irrelevant:false,model_version:adapterModel(extracted.metadata),schema_version:1});
       await repository.save(record,tx);await this.deps.intake.appendEvent(input,'interpretation.completed',tx);
       await this.deps.replies.enqueueCommittedSummary(input,{operation_id:input.operation_id,applied_count:outcomes.filter(item=>item.result.status==='applied').length,pending_count:outcomes.reduce((count,item)=>count+item.result.pending_actions.length,0),project_version:context.project_version},tx);
     });
   }catch(error){
     if(error instanceof GroundError&&['VALIDATION_ERROR','CONFLICT','FORBIDDEN'].includes(error.code)){await this.needsInput(input,actor,record,[error.message]);return;}
     record.status=error instanceof GroundError&&error.code==='NOT_READY'?'pending_handler':'retryable';record.error=error instanceof GroundError?error.message:'No pude procesar el reporte. El original sigue guardado.';
     await transactions.run(async tx=>{await this.deps.intake.assertActive(actor.project_id,actor.run_id,tx);await repository.save(record,tx);await this.deps.intake.appendEvent(input,'input.failed',tx);});
     throw error;
   }
 }
 private async needsInput(input:StoredInput,actor:ActorContext,record:InterpretationRecord,questions:string[]):Promise<void>{
   await this.deps.transactions.run(async tx=>{
     const snapshot=await this.deps.projects.snapshot(actor,tx);const current=await this.deps.repository.get(input.id,tx);if(current&&['completed','needs_input'].includes(current.status))return;
     record.status='needs_input';record.error=questions.slice(0,2).join(' ');
     if(record.question_count>=2){await this.deps.repository.save(record,tx);await this.deps.replies.enqueueReply(input,'El reporte sigue sin resolver. Una persona supervisora debe revisar el original en Ground.',tx);return;}
     const token=randomBytes(8).toString('hex');const count=Math.min(questions.length,2-record.question_count);record.question_count+=count;
     const clarification:Clarification={id:randomUUID(),pending_operation_ids:[input.operation_id],report_id:input.report_id??input.id,thread_id:`telegram:${input.message.chat_id}:${input.message.message_id}`,question:questions.slice(0,count).join('\n').slice(0,700),options:[],allowed_respondent_ids:[actor.actor_id,...snapshot.members.filter(member=>Array.isArray(member.fields['roles'])&&member.fields['roles'].some(role=>['supervisor','admin'].includes(role))).map(member=>member.id)],expected_version:snapshot.project_version,expires_at:new Date(Date.now()+30*60*1000).toISOString(),token_hash:hash(token),answer:null,result:null};
     await this.deps.repository.save(record,tx);await this.deps.repository.saveClarification(input.id,actor,clarification,record.question_count,tx);await this.deps.intake.appendEvent(input,'clarification.required',tx);
     await this.deps.replies.enqueueReply(input,`${clarification.question}\nResponde con: c:${clarification.id}:${token} tu respuesta`,tx);
   });
 }
 async answer(context:ActorContext,id:string,token:string,answer:string,expected_version?:number,tx?:TransactionContext):Promise<OperationResult>{
   if(!tx)return this.deps.transactions.run(current=>this.answer(context,id,token,answer,expected_version,current));
   const snapshot=await this.deps.projects.snapshot(context,tx);const row=await this.deps.repository.clarification(id,context,tx);const clarification=row.clarification;
   const expected=Buffer.from(clarification.token_hash,'hex'),actual=Buffer.from(hash(token),'hex');
   if(!context.permissions.includes('report:create')||!clarification.allowed_respondent_ids.includes(context.actor_id)||expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new GroundError('FORBIDDEN','No puedes responder esta aclaración.');
   if(clarification.result)return clarification.result;
   if(Date.parse(clarification.expires_at)<=Date.now())throw new GroundError('EXPIRED','La aclaración venció. Requiere revisión de supervisión.');
   if(snapshot.project_version!==clarification.expected_version||(expected_version!==undefined&&expected_version!==clarification.expected_version))throw new GroundError('CONFLICT','La obra cambió. Revisa el reporte antes de responder.');
   if(!answer.trim()||answer.length>1000)throw new GroundError('VALIDATION_ERROR','La respuesta debe tener entre 1 y 1000 caracteres.');
   const input=await this.deps.intake.getInput(row.input_id,tx);const record=await this.deps.repository.get(input.id,tx);if(!record)throw new GroundError('NOT_FOUND','Interpretation not found');
   record.answer_text=answer;record.result=null;record.status='processing';record.error=null;
   const job=ingestionJob(input,'process_input',input.id,`clarification:${id}`);
   const result=operationResultSchema.parse({operation_id:input.operation_id,status:'needs_input',event_ids:[],state_diff:[],pending_actions:[{id:job.job_id,kind:'process_input',status:'pending',route:`/api/projects/${context.project_id}/snapshot`}],project_version:snapshot.project_version,evidence_ids:[input.id]});
   clarification.answer=answer;clarification.result=result;await this.deps.repository.resolve(id,clarification,tx);await this.deps.repository.save(record,tx);await this.deps.queue.enqueue(job,tx);await this.deps.intake.appendEvent(input,'clarification.resolved',tx);return result;
 }
 async route(input:StoredInput,actor:ActorContext,tx:TransactionContext):Promise<boolean>{
   const text=input.callback?.data??input.message.text??'';const match=/^c:([a-f0-9-]{36}):([a-f0-9]{16})\s+([\s\S]+)$/.exec(text);
   if(!match)return false;const [,id,token,answer]=match;if(!id||!token||!answer)return false;
   await this.answer(actor,id,token,answer,undefined,tx);return true;
 }
}
function adapterModel(metadata:unknown):string {return z.object({model:z.string().min(1)}).parse(metadata).model;}

const outcomesSchema=z.array(z.object({index:z.number().int(),source_hash:z.string(),proposal:operationProposalSchema,result:operationResultSchema}));
function readOutcomes(value:unknown){return value===undefined?[]:outcomesSchema.parse(value);}
