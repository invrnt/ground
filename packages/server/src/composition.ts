import { notReady, toolNames, type ActorContext, type ToolName, type Job, type SiteCommandService, type TransactionContext, type ExternalObjectLink } from '@ground/contracts';
import { createPool, PgTransactions, PgJobQueue, LocalPrivateFiles, Sessions } from './infra';
import { projectModule, PgProjectRepository } from './modules/project';
import { loadChannels, ChannelRouter, PgChannelOwnership, channelsModule, type ChannelRuntime } from './channels';
import { IngestionService, PgIngestionRepository } from './modules/ingestion';
import { SiteService, siteModule, type ProposalInvalidation } from './modules/site';
import { InterpretationWorkflow, InterpretationRepository, interpretationModule } from './modules/interpretation';
import { ReportProviderAdapter, reportProviderConfiguration } from './adapters/report-provider';
import { LiveService, liveModule } from './modules/live';
import { ExaClient } from './adapters/exa';
import { SourcingService, sourcingModule } from './modules/sourcing';
import { PurchaseService, purchaseModule } from './modules/purchases';
import { ReportingService, reportingModule, purchaseReportSections } from './modules/reporting';
import { ProcurementService, procurementModule } from './modules/procurement';
import { AmbiguousClient } from './adapters/ambiguous';
import { OfficeRepository, OfficeSyncService, workspaceSyncModule } from './modules/workspace-sync';
import { DispatchService, dispatchModule } from './modules/dispatch';
import { OperationsService, operationsModule } from './modules/operations';
import type { FastifyInstance } from 'fastify';
export interface ServerModule { name: string; poll?:()=>Promise<void>; registerRoutes?: (app: FastifyInstance) => Promise<void>; jobs?: Partial<Record<Job['kind'], (job: Job) => Promise<void>>>; }
export interface Composition { runtime?: ReturnType<typeof createRuntime>; modules: readonly ServerModule[]; invoke: (name: ToolName, context: ActorContext, input: unknown) => Promise<unknown>; }
export function createRuntime(options?:{invalidation?:ProposalInvalidation;links?:(context:ActorContext,tx:TransactionContext)=>Promise<ExternalObjectLink[]>}) {
 const pool=createPool();
 const transactions=new PgTransactions(pool);
 const queue=new PgJobQueue(transactions);
 const files=new LocalPrivateFiles(process.env['PRIVATE_STORAGE_PATH']||'/tmp/ground-private');
 const sessions=new Sessions(pool,process.env['PUBLIC_BASE_URL']||'http://localhost:3000');
 const projects=new PgProjectRepository(transactions,options?.links?{links:options.links}:undefined);
 const site=new SiteService({transactions,queue,...(options?.invalidation?{invalidation:options.invalidation}:{})});
 return {pool,transactions,queue,files,sessions,projects,site};
}
export function createComposition(): Composition {
 let procurement:ProcurementService|undefined;let officeRepository:OfficeRepository|undefined;let dispatch:DispatchService|undefined;
 const runtime=createRuntime({invalidation:{changed:(input,tx)=>procurement?procurement.changed(input,tx):Promise.resolve()},links:(context,tx)=>officeRepository?officeRepository.links(context,tx):Promise.resolve([])});
 officeRepository=new OfficeRepository(runtime.transactions);
 const officeLinks=officeRepository;
 const modules:ServerModule[]=[projectModule(runtime.pool,runtime.sessions,runtime.files),siteModule(runtime.site,runtime.sessions)];
 const sourcing=new SourcingService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,adapter:new ExaClient(process.env['EXA_API_KEY']??'')});
 const purchases=new PurchaseService({transactions:runtime.transactions,inventory:runtime.site});
 const reporting=new ReportingService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,supplements:{followup:async(context,tx)=>dispatch?dispatch.reportSections(context,tx):[],links:(context,tx)=>officeLinks.links(context,tx),sources:(context,tx)=>sourcing.sourcesForRun(context,tx),purchases:async(context,tx)=>purchaseReportSections(await purchases.list(context,tx))}});
 const commands:SiteCommandService={execute:(input,tx)=>['register_purchase','confirm_receipt'].includes(input.proposal.type)?purchases.execute(input,tx):runtime.site.execute(input,tx)};
 modules.push(sourcingModule(sourcing,runtime.sessions),purchaseModule(purchases,runtime.sessions),reportingModule(reporting,runtime.sessions));
 const officeToken=process.env['AMBIGUOUS_API_TOKEN'],officeWorkspace=process.env['AMBIGUOUS_WORKSPACE_ID'],officeBase=process.env['AMBIGUOUS_BASE_URL'];
 if(officeToken&&officeWorkspace){const office=new OfficeSyncService({repository:officeLinks,adapter:new AmbiguousClient({token:officeToken,workspace_id:officeWorkspace,...(officeBase?{base_url:officeBase}:{})}),files:runtime.files,queue:runtime.queue,public_base_url:runtime.sessions.origin});modules.push(workspaceSyncModule(office));}else modules.push({name:'office_configuration_pending'});
 let workflow:InterpretationWorkflow|undefined;
 const repository=new PgIngestionRepository(tx=>runtime.transactions.client(tx));
 const loaded=loadChannels();
 for(const problem of loaded.problems)modules.push({name:`channel_configuration_problem(${problem.provider}): ${problem.reason}`});
 const runtimes:ChannelRuntime[]=loaded.channels.map(definition=>{
  const ingestion=new IngestionService({bot_id:definition.bot_id,adapter:definition.adapter,repository,transactions:runtime.transactions,queue:runtime.queue,files:runtime.files,router:{route:(input,actor,tx)=>workflow?workflow.route(input,actor,tx):Promise.resolve(false)}});
  const delivery=new DispatchService({transactions:runtime.transactions,queue:runtime.queue,authorization:{authorizedDispatch:(context,id,version,tx)=>procurement?procurement.authorizedDispatch(context,id,version,tx):Promise.reject(new Error('Procurement is not registered'))},adapter:definition.adapter,bot_id:definition.bot_id,provider:definition.provider,files:runtime.files,public_base_url:runtime.sessions.origin});
  return {...definition,ingestion,dispatch:delivery};
 });
 const channels=new ChannelRouter(runtimes,new PgChannelOwnership(runtime.transactions));
 modules.push(channelsModule(channels));
 const primary=runtimes[0];
 if(primary){
  dispatch=primary.dispatch;
  /** The router owns every channel job; this module contributes only its HTTP routes, or
      its handlers would overwrite the router's and strand the other channels' work. */
  const {jobs:_channelJobsOwnedByRouter,...dispatchRoutes}=dispatchModule(primary.dispatch,runtime.sessions);
  modules.push(dispatchRoutes);
  const {config}=reportProviderConfiguration();
  if(config) {
   const reportProvider=new ReportProviderAdapter(config,runtime.files);
   workflow=new InterpretationWorkflow({transactions:runtime.transactions,repository:new InterpretationRepository(runtime.transactions),intake:repository,replies:channels,projects:runtime.projects,commands,purchases,queries:reporting,queue:runtime.queue,files:runtime.files,adapter:reportProvider});
   modules.push(interpretationModule(workflow,runtime.sessions));
  }
 }
 if(!workflow)modules.push({name:'interpretation_configuration_pending'});
 if(!dispatch)modules.push({name:'dispatch_configuration_pending'});
 modules.push(operationsModule(new OperationsService({transactions:runtime.transactions,queue:runtime.queue}),runtime.sessions));
 const activeWorkflow=workflow;
 const live=new LiveService(runtime.transactions,runtime.projects,{history:(context,id,tx)=>runtime.site.history(context,id,tx),...(activeWorkflow?{transcript:(context:ActorContext,id:string,tx:import('@ground/contracts').TransactionContext)=>activeWorkflow.transcriptForInput(context,id,tx)}:{})});
 procurement=new ProcurementService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,sourcing,checkpoints:live,secret:process.env['SESSION_SECRET']??''});
 const decisions=procurement;
 modules.push(procurementModule(decisions,runtime.sessions),liveModule(live,runtime.sessions,{arguments:(context,checkpoint)=>decisions.arguments(context,checkpoint),decide:(context,_checkpoint,input)=>decisions.decide(context,input)}));
 return {runtime,modules,invoke:async(name,context)=> {
  if(name==='get_project_context')return runtime.projects.snapshot(context);
  if(name==='get_inventory')return (await runtime.projects.snapshot(context)).stock;
  if(name==='get_work_plan')return (await runtime.projects.snapshot(context)).work;
  if(name==='list_open_issues')return (await runtime.projects.snapshot(context)).issues.filter(issue=>issue.fields['status']!=='resolved');
  return notReady(name);
 }};
}
export const unavailableTools = toolNames.filter(name=>!['get_project_context','get_inventory','get_work_plan','list_open_issues'].includes(name));
