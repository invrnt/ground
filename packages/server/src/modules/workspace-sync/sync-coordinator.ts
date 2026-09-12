import {GroundError,type ExternalObjectLink,type RemoteObject} from '@ground/contracts';
import {OfficeRepository} from './office-repository';
export interface SyncPlan {project_id:string;run_id:string;local_id:string;object_kind:'file'|'task'|'document';identity_key:string;version:number;hash:string;create:(marker:string)=>Promise<RemoteObject>;read:(id:string)=>Promise<RemoteObject>;update:(remote:RemoteObject,marker:string)=>Promise<RemoteObject>;verify:(remote:RemoteObject)=>Promise<boolean>;find:(marker:string)=>Promise<{status:'unique'|'none'|'ambiguous'|'unsupported';object:RemoteObject|null}>;}
export class SyncCoordinator {
 constructor(private readonly repository:OfficeRepository){}
 async sync(plan:SyncPlan):Promise<ExternalObjectLink>{const record=await this.repository.claim(plan);
  if(record.status==='synced'&&((record.synced_version>plan.version)||(record.desired_hash===plan.hash)))return this.repository.link(record);
  if(['sending','uncertain','needs_review'].includes(record.status)){
   const found=record.remote_id?{status:'unique' as const,object:await plan.read(record.remote_id)}:await plan.find(record.marker);
   if(found.status==='unique'&&found.object&&await plan.verify(found.object))return this.repository.complete(record,plan,found.object);
   await this.repository.failed(record,'needs_review','Remote outcome requires manual reconciliation; no second create was attempted');throw new GroundError('UNCERTAIN','Office creation requires reconciliation');
  }
  await this.repository.sending(record,plan);
  try{
   const remote=record.remote_id?await plan.update(await plan.read(record.remote_id),record.marker):await plan.create(record.marker);
   await this.repository.remember(record,remote);const verified=await plan.read(remote.id);
   if(!await plan.verify(verified))throw new GroundError('UNCERTAIN','Remote read-back did not match the intended content');
   return await this.repository.complete(record,plan,verified);
  }catch(error){const uncertain=!(error instanceof GroundError)||error.code==='UNCERTAIN'||record.remote_id!==null;await this.repository.failed(record,uncertain?'uncertain':'failed',error instanceof GroundError?error.message:'Office provider outcome is unknown');throw error;}
 }
}
