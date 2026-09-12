import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {isolatedDatabase} from '../../infra/test-database';
import {PgTransactions} from '../../infra/database';
import {PgJobQueue} from '../../infra/jobs';
import {configureDemo,seedDemo,demoProjectId} from '../project/seed';
import {manifestSchema} from '../project/manifest';
import {PgProjectRepository} from '../project/repository';
import {SiteService} from '../site';
import {SourcingService} from '../sourcing';
import {ExaClient} from '../../adapters/exa';
import {LiveService} from '../live';
import {ProcurementService} from '../procurement';
import {BotTelegramAdapter} from '../../adapters/telegram';
import {DispatchService} from './dispatch-service';
import {jobSchema,type ActorContext} from '@ground/contracts';
it.skipIf(!process.env['TEST_DATABASE_URL'])('never repeats uncertain sends and cancels resolved or retired followups after restart',async()=>{
 const url=process.env['TEST_DATABASE_URL'];if(!url)throw Error('Test DB required');const fixture=await isolatedDatabase(url);let now=new Date();const clock={now:()=>now};
 try{
  const transactions=new PgTransactions(fixture.pool),queue=new PgJobQueue(transactions,clock),projects=new PgProjectRepository(transactions);const manifest=manifestSchema.parse(JSON.parse(await readFile(new URL('../../../../../demo/manifest.json',import.meta.url),'utf8')));manifest.test_address='Demo address';manifest.test_recipient_id='999';manifest.test_recipient_reachable=true;manifest.members=manifest.members.map(member=>({...member,telegram_sender_id:member.username==='ana'?'2':member.telegram_sender_id}));await configureDemo(transactions,manifest,Object.fromEntries(manifest.members.map(member=>[member.username,randomUUID()])));const run=await seedDemo(transactions,manifest);now=new Date();const actor_id=(await fixture.pool.query<{id:string}>("SELECT id FROM members WHERE username='ana'")).rows[0]?.id;if(!actor_id)throw Error('Ana missing');const actor:ActorContext={actor_id,project_id:demoProjectId,run_id:run,roles:['supervisor'],permissions:['costs','approve'],trusted_time:now.toISOString()};
  await new SiteService({transactions,queue}).execute({context:actor,proposal:{type:'consume_material',entity_ids:{material_id:'00000000-0000-4000-8000-000000000020',location_id:'00000000-0000-4000-8000-000000000010'},fields:{quantity:'8',unit:'box'},expected_version:0,evidence_ids:[]},source_message_id:randomUUID(),idempotency_key:'consume'});const need=(await projects.snapshot(actor)).needs[0];if(!need)throw Error('Need missing');const procurement=new ProcurementService({transactions,queue,projects,sourcing:new SourcingService({transactions,queue,projects,adapter:new ExaClient('')}),checkpoints:new LiveService(transactions,projects),secret:'fixture-secret-with-at-least-thirty-two-characters',clock});
  const approve=async()=>{const view=await procurement.create(actor,{need_id:need.id,need_version:need.version,candidate_id:null});if(!view.checkpoint_token)throw Error('Token missing');await procurement.decide(actor,{proposal_id:view.proposal.id,proposal_version:1,decision:'approve',checkpoint_token:view.checkpoint_token});return view.proposal.id;};
  let sends=0,uncertain=true;const adapter=new BotTelegramAdapter({token:'test',webhook_secret:'secret'},async(_url,init)=>{sends++;if(uncertain)throw Error('Simulated lost response');const body=JSON.parse(String(init?.body));return Response.json({ok:true,result:{message_id:sends,date:Math.floor(now.getTime()/1000),chat:{id:Number(body.chat_id)}}});});
  const make=()=>new DispatchService({transactions,queue,authorization:procurement,adapter,provider:'telegram' as const,bot_id:'test',files:{put:async()=>{},read:async()=>new Uint8Array(),remove:async()=>{}},clock,public_base_url:'http://localhost:3000'});
  const first=await approve();await expect(make().dispatch(actor,first,1)).rejects.toMatchObject({code:'UNCERTAIN'});await expect(make().dispatch(actor,first,1)).rejects.toMatchObject({code:'UNCERTAIN'});expect(sends).toBe(1);
  const firstRow=(await fixture.pool.query<{id:string}>('SELECT id FROM outbound_requests WHERE proposal_id=$1',[first])).rows[0];if(!firstRow)throw Error('Missing uncertain request');const observation={expected_status:'uncertain',outcome:'confirmed_not_sent',provider_message_id:null,note:'Inspected the authorized demo conversation; message not delivered.',evidence_ids:[]};await make().reconcile(actor,firstRow.id,observation,'reconcile-first');await make().reconcile(actor,firstRow.id,observation,'reconcile-first');await expect(make().dispatch(actor,first,1)).rejects.toMatchObject({code:'CONFLICT'});expect(sends).toBe(1);expect((await fixture.pool.query('SELECT 1 FROM dispatch_reconciliations')).rowCount).toBe(1);
  uncertain=false;const second=await approve();const sent=await make().dispatch(actor,second,1);expect(sent.status).toBe('sent');expect(sends).toBe(2);
  await make().acceptRecipientReply('secret',{update_id:50,message:{message_id:50,date:Math.floor(now.getTime()/1000),chat:{id:999},from:{id:999},reply_to_message:{message_id:2},text:'Recibido, revisaremos la disponibilidad.'}});
  now=new Date(now.getTime()+120000);const raw=(await fixture.pool.query<Record<string,unknown>>("SELECT * FROM scheduled_jobs WHERE kind='follow_up' AND payload->>'subject_id'=(SELECT id::text FROM request_followups WHERE request_id=$1)",[sent.id])).rows[0];if(!raw)throw Error('Followup missing');const {desired_job:_desired,...wire}=raw;const job=jobSchema.parse({...wire,available_at:wire['available_at'] instanceof Date?wire['available_at'].toISOString():wire['available_at'],due_at:wire['due_at'] instanceof Date?wire['due_at'].toISOString():wire['due_at'],lease_expires_at:null});await make().followup(job);expect(sends).toBe(2);expect((await fixture.pool.query<{status:string}>('SELECT status FROM request_followups WHERE request_id=$1',[sent.id])).rows[0]?.status).toBe('cancelled');
  const third=await approve();const thirdSent=await make().dispatch(actor,third,1);expect(sends).toBe(3);await fixture.pool.query("UPDATE scenario_runs SET status='retired' WHERE id=$1",[run]);await expect(make().dispatch(actor,third,1)).rejects.toMatchObject({code:'CONFLICT'});await make().followup({...job,payload:{subject_id:(await fixture.pool.query<{id:string}>('SELECT id FROM request_followups WHERE request_id=$1',[thirdSent.id])).rows[0]!.id,expected_version:1}});expect(sends).toBe(3);
 }finally{await fixture.close();}
});
