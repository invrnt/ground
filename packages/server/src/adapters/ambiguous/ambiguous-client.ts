import { createHash } from 'node:crypto';
import { z } from 'zod';
import { GroundError,type AmbiguousAdapter,type RemoteObject } from '@ground/contracts';
const id=z.string().uuid();
const baseObject=z.object({id,updated_at:z.string().nullable().optional()});
const fileSchema=baseObject.extend({name:z.string(),mime_type:z.string().nullable(),size_bytes:z.number().nullable()});
const taskSchema=baseObject.extend({title:z.string(),description:z.string().nullable().optional(),assignee_id:id.nullable().optional(),due_date:z.string().nullable().optional(),status:z.string()});
const documentSchema=baseObject.extend({title:z.string(),content:z.string().nullable(),labels:z.array(z.string()).optional()});
const duePrefix='Ground due UTC: ';const evidencePrefix='Ground evidence: ';
export class AmbiguousClient implements AmbiguousAdapter {
 private readonly base:string;
 private workspaceChecked=false;
 constructor(private readonly config:{token:string;workspace_id:string;base_url?:string},private readonly fetcher:typeof fetch=fetch){const url=new URL(config.base_url||'https://app.ambiguous.ai');if(!['https://app.ambiguous.ai','https://app.devambi.cc'].includes(url.origin)||url.pathname!=='/'||url.search||url.hash)throw new GroundError('VALIDATION_ERROR','Unsupported Ambiguous API base');this.base=url.origin;}
 private async call(path:string,method='GET',body?:object|FormData):Promise<unknown>{
  if(!this.config.token||!this.config.workspace_id)throw new GroundError('NOT_READY','Ambiguous token and workspace mapping are required');
  if(path!=='/api/users/me'&&!this.workspaceChecked)await this.checkCapabilities();
  const write=method!=='GET';
  try{const response=await this.fetcher(`${this.base}${path}`,{method,headers:{Authorization:`Bearer ${this.config.token}`,'API-Version':'1',...(body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000),redirect:'error'});
   if(!response.ok){if(response.status>=500&&write)throw new GroundError('UNCERTAIN','Ambiguous write outcome is unknown');throw new GroundError(response.status===401||response.status===403?'NOT_READY':'PROVIDER_UNAVAILABLE','Ambiguous request was rejected',response.status===429||response.status>=500);}
   try{return await response.json();}catch{throw new GroundError(write?'UNCERTAIN':'PROVIDER_UNAVAILABLE','Ambiguous response was unreadable',!write);}
  }catch(error){if(error instanceof GroundError)throw error;throw new GroundError(write?'UNCERTAIN':'PROVIDER_UNAVAILABLE',write?'Ambiguous write may have completed':'Ambiguous is unavailable',!write);}
 }
 private object(value:z.infer<typeof baseObject>,kind:'file'|'task'|'document'):RemoteObject{return {id:value.id,url:kind==='file'?`${this.base}/api/drive/${value.id}/content`:`${this.base}/${kind==='task'?'tasks':'docs'}/${value.id}`,revision:value.updated_at??null};}
 async checkCapabilities(){const user=z.object({workspace_id:id.nullable()}).parse(await this.call('/api/users/me'));if(user.workspace_id!==this.config.workspace_id)throw new GroundError('NOT_READY','Ambiguous token belongs to a different workspace');this.workspaceChecked=true;return {upload_read:true,task_assignment_due_date:true,document_read_update:true,reconciliation:true};}
 async verifyUser(userId:string):Promise<void>{id.parse(userId);const result=z.object({data:z.array(z.object({id})),has_more:z.boolean()}).parse(await this.call('/api/users?limit=100'));if(!result.data.some(user=>user.id===userId))throw new GroundError('NOT_READY','Mapped assignee must be verified in the Ambiguous workspace');}
 async uploadEvidence(input:{bytes:Uint8Array;filename:string;content_type:string;sha256:string;marker:string}):Promise<RemoteObject>{
  if(input.bytes.byteLength>10*1024*1024||createHash('sha256').update(input.bytes).digest('hex')!==input.sha256)throw new GroundError('VALIDATION_ERROR','Evidence hash or size is invalid');
  const form=new FormData();form.append('file',new Blob([new Uint8Array(input.bytes)],{type:input.content_type}),`${input.marker}-${input.filename.replace(/[^a-zA-Z0-9._-]/g,'_')}`);
  return this.object(fileSchema.parse(await this.call('/api/drive/upload-proxy','POST',form)),'file');
 }
 async getFile(fileId:string):Promise<RemoteObject>{return this.object(fileSchema.parse(await this.call(`/api/drive/${id.parse(fileId)}`)),'file');}
 async verifyFile(fileId:string,size:number,mime:string,sha256?:string):Promise<boolean>{const file=fileSchema.parse(await this.call(`/api/drive/${id.parse(fileId)}`));if(file.size_bytes!==size||file.mime_type!==mime)return false;if(!sha256)return true;try{const signal=AbortSignal.timeout(20000);let response=await this.fetcher(`${this.base}/api/drive/${fileId}/content`,{headers:{Authorization:`Bearer ${this.config.token}`,'API-Version':'1'},signal,redirect:'manual'});
   if([301,302,303,307,308].includes(response.status)){
    const location=response.headers.get('location');await response.body?.cancel();
    if(!location)throw new GroundError('PROVIDER_UNAVAILABLE','Remote evidence redirect is missing');
    const target=new URL(location);
    if(target.protocol!=='https:'||target.hostname!=='storage.googleapis.com'||target.port||target.username||target.password)throw new GroundError('PROVIDER_UNAVAILABLE','Remote evidence redirect is not trusted');
    response=await this.fetcher(target.toString(),{signal,redirect:'error'});
   }
   if(!response.ok||!response.body)throw new GroundError('PROVIDER_UNAVAILABLE','Remote original could not be read',true);const reader=response.body.getReader();const digest=createHash('sha256');let length=0;for(;;){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.byteLength;if(length>10*1024*1024){await reader.cancel();return false;}digest.update(chunk.value);}return length===size&&digest.digest('hex')===sha256;}catch(error){if(error instanceof GroundError)throw error;throw new GroundError('PROVIDER_UNAVAILABLE','Remote evidence verification failed',true);}}
 private taskDescription(description:string,due:string,evidence:string,marker:string){return `${description}\n\n${marker}\n${duePrefix}${due}\nHora local: ${new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',dateStyle:'medium',timeStyle:'short'}).format(new Date(due))}\n${evidencePrefix}${evidence}`;}
 async createTask(input:{title:string;description:string;assignee_id:string;due_at:string;evidence_url:string;marker:string;status?:string}):Promise<RemoteObject>{await this.verifyUser(input.assignee_id);const task=z.object({task:taskSchema}).parse(await this.call('/api/tasks','POST',{title:input.title.slice(0,255),description:this.taskDescription(input.description,input.due_at,input.evidence_url,input.marker),assignee_id:input.assignee_id,due_date:this.localDate(input.due_at),status:({pending:'todo',in_progress:'in_progress',completed:'done',cancelled:'cancelled'}[input.status??'pending']??'todo')}));return this.object(task.task,'task');}
 private localDate(due:string){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(due));}
 async updateTask(taskId:string,input:{desired_version:number;status?:string;due_at?:string;assignee_id?:string;description?:string;evidence_url?:string;marker?:string;title?:string}):Promise<RemoteObject>{
  const current=z.object({task:taskSchema}).parse(await this.call(`/api/tasks/${id.parse(taskId)}`)).task;
  const due=input.due_at??lineValue(current.description??'',duePrefix),evidence=input.evidence_url??lineValue(current.description??'',evidencePrefix);
  if(!due||!evidence)throw new GroundError('CONFLICT','Task managed metadata is missing');
  if(input.assignee_id)await this.verifyUser(input.assignee_id);
  const status=input.status?({pending:'todo',in_progress:'in_progress',completed:'done',cancelled:'cancelled'}[input.status]):undefined;if(input.status&&!status)throw new GroundError('VALIDATION_ERROR','Unsupported task status');
  const description=input.description!==undefined&&input.marker?this.taskDescription(input.description,due,evidence,input.marker):(current.description??'').replace(new RegExp(`${duePrefix}[^\\n]*`),`${duePrefix}${due}`);
  const updated=z.object({task:taskSchema}).parse(await this.call(`/api/tasks/${taskId}`,'PATCH',{description,due_date:this.localDate(due),...(input.title?{title:input.title.slice(0,255)}:{}),...(input.assignee_id?{assignee_id:input.assignee_id}:{}),...(status?{status}:{})}));return this.object(updated.task,'task');
 }
 async getTask(taskId:string){const task=z.object({task:taskSchema}).parse(await this.call(`/api/tasks/${id.parse(taskId)}`)).task;const due=lineValue(task.description??'',duePrefix),evidence=lineValue(task.description??'',evidencePrefix);if(!task.assignee_id||!due||!evidence||task.due_date!==this.localDate(due))throw new GroundError('CONFLICT','Remote task assignment or due metadata is incomplete');return {...this.object(task,'task'),title:task.title,status:task.status,description:task.description??'',assignee_id:task.assignee_id,due_at:due,evidence_url:evidence};}
 async createDocument(input:{title:string;content:string;marker:string}):Promise<RemoteObject>{const doc=documentSchema.parse(await this.call('/api/documents','POST',{type:'doc',title:input.title,content:managedBlock(input.content),labels:[input.marker],visibility:'restricted'}));return this.object(doc,'document');}
 async getDocument(documentId:string){const doc=documentSchema.parse(await this.call(`/api/documents/${id.parse(documentId)}`));return {...this.object(doc,'document'),content:doc.content??''};}
 async updateDocument(documentId:string,input:{observed_revision:string|null;content:string}):Promise<RemoteObject>{const current=await this.getDocument(documentId);if(!input.observed_revision||current.revision!==input.observed_revision)throw new GroundError('CONFLICT','Remote document changed; read it again');const marker=input.content.split('\n')[0]??'';const block=findManagedBlock(current.content,marker);if(!block)throw new GroundError('NOT_READY','Remote managed block ID is unavailable; manual review required');const updated=documentSchema.parse(await this.call(`/api/documents/${documentId}`,'PATCH',{operations:[{type:'replace',blockId:block,content:managedBlock(input.content)}]}));return this.object(updated,'document');}
 async findByMarker(kind:'file'|'task'|'document',marker:string):Promise<{status:'unique'|'none'|'ambiguous'|'unsupported';object:RemoteObject|null}>{
  let cursor:string|undefined;const found:RemoteObject[]=[];
  for(let page=0;page<10;page++){
   const path=kind==='file'?'/api/drive':kind==='task'?'/api/tasks':'/api/documents';const query=new URLSearchParams({limit:'100',...(kind==='document'?{type:'doc'}:{q:marker}),...(cursor?{cursor}:{})});
   const result=z.object({data:z.array(z.unknown()),has_more:z.boolean(),next_cursor:z.string().optional()}).parse(await this.call(`${path}?${query}`));
   for(const raw of result.data){if(kind==='file'){const item=fileSchema.parse(raw);if(item.name.startsWith(`${marker}-`))found.push(this.object(item,kind));}else if(kind==='task'){const item=taskSchema.parse(raw);if((item.description??'').split('\n').includes(marker))found.push(this.object(item,kind));}else{const item=baseObject.extend({labels:z.array(z.string()).optional(),title:z.string()}).parse(raw);if(item.labels?.includes(marker))found.push(this.object(item,kind));}}
   if(found.length>1)return {status:'ambiguous',object:null};if(!result.has_more)return {status:found.length===1?'unique':'none',object:found[0]??null};if(!result.next_cursor)return {status:'unsupported',object:null};cursor=result.next_cursor;
  }return {status:'unsupported',object:null};
 }
}
function lineValue(text:string,prefix:string){return text.split('\n').find(line=>line.startsWith(prefix))?.slice(prefix.length)??'';}
function managedBlock(text:string){const fence='`'.repeat(Math.max(3,...(text.match(/`+/g)??[]).map(run=>run.length+1)));return `${fence}\n${text}\n${fence}`;}
function findManagedBlock(content:string,marker:string):string|null {let value:unknown;try{value=JSON.parse(content);}catch{return null;}const visit=(node:unknown):string|null=>{const parsed=z.object({type:z.string().optional(),attrs:z.object({blockId:z.string().optional()}).passthrough().optional(),content:z.array(z.unknown()).optional(),text:z.string().optional()}).safeParse(node);if(!parsed.success)return null;const text=(parsed.data.content??[]).map(child=>z.object({text:z.string().optional()}).passthrough().safeParse(child)).map(child=>child.success?child.data.text??'':'').join('');if(text.startsWith(`${marker}\n`)&&parsed.data.attrs?.blockId)return parsed.data.attrs.blockId;for(const child of parsed.data.content??[]){const found=visit(child);if(found)return found;}return null;};return visit(value);}
export function documentContains(content:string,text:string):boolean {try{const value:unknown=JSON.parse(content);const texts:string[]=[];const walk=(node:unknown)=>{if(typeof node!=='object'||node===null)return;if('text'in node&&typeof node.text==='string')texts.push(node.text);if('content'in node&&Array.isArray(node.content))node.content.forEach(walk);};walk(value);return texts.join('').includes(text);}catch{return content.includes(text);}}
