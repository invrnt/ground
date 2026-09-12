import {expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {GroundError,type RemoteObject} from '@ground/contracts';
import {isolatedDatabase} from '../../infra/test-database';
import {PgTransactions} from '../../infra/database';
import {OfficeRepository} from './office-repository';
import {SyncCoordinator,type SyncPlan} from './sync-coordinator';
it.skipIf(!process.env['TEST_DATABASE_URL'])('reconciles uncertain creation once or leaves explicit review',async()=>{
 const url=process.env['TEST_DATABASE_URL'];if(!url)throw Error('Test DB required');const fixture=await isolatedDatabase(url);
 try{
  const project=randomUUID(),run=randomUUID();await fixture.pool.query("INSERT INTO projects(id,name) VALUES($1,'Sync test')",[project]);await fixture.pool.query("INSERT INTO scenario_runs(id,project_id,status,scenario_version,scenario_date) VALUES($1,$2,'active','test','2026-09-12')",[run,project]);
  const repository=new OfficeRepository(new PgTransactions(fixture.pool));let creates=0;const remote:RemoteObject={id:randomUUID(),url:'https://app.ambiguous.ai/docs/test',revision:'1'};
  const plan:SyncPlan={project_id:project,run_id:run,local_id:randomUUID(),object_kind:'document',identity_key:'2026-09-12',version:1,hash:'known-hash',create:async()=>{creates++;throw new GroundError('UNCERTAIN','Remote creation timed out');},read:async()=>remote,update:async()=>remote,verify:async()=>true,find:async()=>({status:'unique',object:remote})};
  const first=new SyncCoordinator(repository);await expect(first.sync(plan)).rejects.toMatchObject({code:'UNCERTAIN'});const restarted=new SyncCoordinator(repository);expect((await restarted.sync(plan)).remote_id).toBe(remote.id);expect(creates).toBe(1);await restarted.sync(plan);expect(creates).toBe(1);
  const unknown={...plan,local_id:randomUUID(),identity_key:'2026-09-13',find:async()=>({status:'unsupported' as const,object:null})};await expect(first.sync(unknown)).rejects.toMatchObject({code:'UNCERTAIN'});await expect(restarted.sync(unknown)).rejects.toMatchObject({code:'UNCERTAIN'});expect(creates).toBe(2);expect((await fixture.pool.query("SELECT 1 FROM office_objects WHERE status='needs_review'")).rowCount).toBe(1);
 }finally{await fixture.close();}
});

import {AmbiguousClient,documentContains} from '../../adapters/ambiguous';
it('targets only the managed document block and keeps human content outside the request',async()=>{
 const workspace=randomUUID(),document=randomUUID(),marker='ground-test-document';let patch:unknown;
 const content=JSON.stringify({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Human note stays untouched'}]},{type:'codeBlock',attrs:{blockId:'managed-block'},content:[{type:'text',text:`${marker}\nold report`}]}]});
 const client=new AmbiguousClient({token:'test',workspace_id:workspace},async(url,init)=>{
  if(String(url).endsWith('/api/users/me'))return Response.json({workspace_id:workspace});
  if(init?.method==='PATCH'){patch=JSON.parse(String(init.body));return Response.json({id:document,title:'Ground report',content,updated_at:'new'});}
  return Response.json({id:document,title:'Ground report',content,updated_at:'old'});
 });
 await client.updateDocument(document,{observed_revision:'old',content:`${marker}\nnew report`});
 expect(patch).toEqual({operations:[{type:'replace',blockId:'managed-block',content:`\x60\x60\x60\n${marker}\nnew report\n\x60\x60\x60`}]});
 expect(documentContains(content,`${marker}\nold report`)).toBe(true);
});
