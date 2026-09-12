import { z } from 'zod';
import { operationProposalSchema, GroundError, type OperationProposal, type ProjectSnapshot, type Purchase } from '@ground/contracts';
import type { Extraction } from '../../adapters/openrouter/extraction';
const objectSchema=z.record(z.unknown());
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
type Entity=ProjectSnapshot['work'][number];
function resolve(reference:string,entities:Entity[]):string {
  const found=entities.filter(entity=>entity.id===reference||Object.entries(entity.fields).some(([key,value])=>['name','display_name','code','aliases'].includes(key)&&(typeof value==='string'?normalize(value)===normalize(reference):Array.isArray(value)&&value.some(alias=>normalize(alias)===normalize(reference)))));
  if(found.length!==1)throw new GroundError('VALIDATION_ERROR',`Confirma la referencia: ${reference.slice(0,80)}.`);
  return found[0]!.id;
}
export function scenarioDueAt(value:unknown,scenarioDate:string):string {
  if(typeof value!=='string')throw new GroundError('VALIDATION_ERROR','Confirma fecha y hora de revisión.');
  const match=/^(today|tomorrow|hoy|mañana|\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/.exec(value);
  if(!match)throw new GroundError('VALIDATION_ERROR','Confirma fecha y hora local de revisión.');
  const [,day,hour,minute]=match;
  if(!day||!hour||!minute||Number(hour)>23||Number(minute)>59)throw new GroundError('VALIDATION_ERROR','La hora no es válida.');
  const date=['today','tomorrow','hoy','mañana'].includes(day)?new Date(`${scenarioDate}T00:00:00Z`):new Date(`${day}T00:00:00Z`);
  if(day==='tomorrow'||day==='mañana')date.setUTCDate(date.getUTCDate()+1);
  if(!Number.isFinite(date.getTime()))throw new GroundError('VALIDATION_ERROR','La fecha no es válida.');
  // Bogota uses UTC-05:00 year-round. Scenario date, never machine-local date.
  return new Date(`${date.toISOString().slice(0,10)}T${hour}:${minute}:00-05:00`).toISOString();
}
export function resolveCommand(command:Extraction['commands'][number],context:ProjectSnapshot,evidence_ids:string[],document_hash:string|null,newIssue:string|null,purchases:Purchase[]=[]):OperationProposal {
  const entities:Record<string,string>={};
  for(const pair of command.entity_ids) {
    if(entities[pair.name])throw new GroundError('VALIDATION_ERROR','Duplicate entity reference');
    const list=pair.name==='location_id'?context.locations:pair.name==='material_id'?context.stock:pair.name==='assignee_id'?context.members:pair.name==='work_item_id'||pair.name==='blocking_work_item_id'?context.work:pair.name==='issue_id'?context.issues:pair.name==='assignment_id'?context.tasks:null;
    if(pair.name==='issue_id'&&pair.reference==='new_issue') {if(!newIssue)throw new GroundError('VALIDATION_ERROR','Confirma la incidencia que debe revisarse.');entities[pair.name]=newIssue;}
    else if(pair.name==='purchase_id'){const matches=purchases.filter(purchase=>purchase.id===pair.reference||(purchase.reference!==null&&normalize(purchase.reference)===normalize(pair.reference)));if(matches.length!==1)throw new GroundError('VALIDATION_ERROR','Confirma la factura correspondiente a la entrega.');entities[pair.name]=matches[0]!.id;}
    else entities[pair.name]=list?resolve(pair.reference,list):pair.reference;
  }
  let raw:unknown;try{raw=JSON.parse(command.fields_json);}catch{throw new GroundError('VALIDATION_ERROR','Los campos extraídos no son válidos.');}
  const fields=objectSchema.parse(raw);
  if('due_at' in fields)fields['due_at']=scenarioDueAt(fields['due_at'],context.scenario_date);
  if(command.type==='register_purchase') {
    if(!document_hash)throw new GroundError('VALIDATION_ERROR','Adjunta la factura para registrar la compra.');
    fields['document_hash']=document_hash;
    if(Array.isArray(fields['lines']))fields['lines']=fields['lines'].map(line=>{const item=objectSchema.parse(line);return {...item,material_id:resolve(z.string().parse(item['material_id']),context.stock)};});
  }
  if(command.type==='confirm_receipt'&&Array.isArray(fields['lines'])){
    const purchase=purchases.find(purchase=>purchase.id===entities['purchase_id']);
    if(!purchase)throw new GroundError('VALIDATION_ERROR','Confirma la factura de la entrega.');
    fields['lines']=fields['lines'].map(line=>{const item=objectSchema.parse(line),reference=z.string().parse(item['line_id']);let matches=purchase.lines.filter(line=>line.id===reference||line.material_id===reference||normalize(line.material_name)===normalize(reference));if(!matches.length){const material=resolve(reference,context.stock);matches=purchase.lines.filter(line=>line.material_id===material);}if(matches.length!==1)throw new GroundError('VALIDATION_ERROR','Confirma la línea de factura que llegó.');return {...item,line_id:matches[0]!.id};});
  }
  const result=operationProposalSchema.safeParse({type:command.type,entity_ids:entities,fields,evidence_ids,expected_version:context.project_version});
  if(!result.success)throw new GroundError('VALIDATION_ERROR','Faltan campos válidos para registrar el cambio.');
  return result.data;
}
export function assertExtraction(extraction:Extraction,source:string):void {
  if(extraction.irrelevant&&(extraction.commands.length||extraction.query_intent))throw new GroundError('VALIDATION_ERROR','La clasificación del reporte es inconsistente.');
  if(extraction.commands.some(command=>command.type==='confirm_receipt')&&(!extraction.explicit_receipt||!/(recib|lleg[oó]|entreg|receiv|arriv)/i.test(source)))throw new GroundError('VALIDATION_ERROR','Confirma explícitamente qué material llegó a la obra y su cantidad.');
  if(!extraction.irrelevant&&!extraction.query_intent&&!extraction.commands.length&&!extraction.missing_fields.length)throw new GroundError('VALIDATION_ERROR','Describe qué cambió en la obra.');
}
