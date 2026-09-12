import { expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isolatedDatabase } from '../../infra/test-database';
import { PgTransactions } from '../../infra/database';
import { PgJobQueue } from '../../infra/jobs';
import { configureDemo,seedDemo,demoProjectId } from '../project/seed';
import { manifestSchema } from '../project/manifest';
import { SiteService } from '../site';
import { PurchaseService } from './purchase-service';
import { PgProjectRepository } from '../project/repository';
import { resolveCommand } from '../interpretation/resolve-extraction';
import type { ActorContext,OperationProposal } from '@ground/contracts';
it.skipIf(!process.env['TEST_DATABASE_URL'])('records 228000 without stock and receives six bags once',async()=>{
 const url=process.env['TEST_DATABASE_URL'];if(!url)throw Error('Test database required');
 const fixture=await isolatedDatabase(url);
 try{
  const transactions=new PgTransactions(fixture.pool),queue=new PgJobQueue(transactions),inventory=new SiteService({transactions,queue});
  const service=new PurchaseService({transactions,inventory});
  const manifest=manifestSchema.parse(JSON.parse(await readFile(new URL('../../../../../demo/manifest.json',import.meta.url),'utf8')));await configureDemo(transactions,manifest,Object.fromEntries(manifest.members.map(member=>[member.username,randomUUID()])));const run_id=await seedDemo(transactions,manifest);
  const member=await fixture.pool.query<{id:string}>("SELECT id FROM members WHERE username='ana'");const actor_id=member.rows[0]?.id;if(!actor_id)throw Error('Missing member');
  const context:ActorContext={actor_id,project_id:demoProjectId,run_id,roles:['supervisor'],permissions:['report:create','costs'],trusted_time:new Date().toISOString()};
  const evidence=randomUUID(),source=randomUUID(),hash='a'.repeat(64);await fixture.pool.query("INSERT INTO private_files(id,project_id,run_id,content_type,sha256,size_bytes,restricted) VALUES($1,$2,$3,'application/pdf',$4,100,true)",[evidence,demoProjectId,run_id,hash]);
  const invoice:OperationProposal={type:'register_purchase',entity_ids:{},fields:{issuer:'Demo supplier',reference:'F-DEMO-001',currency:'COP',document_hash:hash,lines:[{material_id:'00000000-0000-4000-8000-000000000021',quantity:'6',unit:'bag',unit_price:'38000'}]},expected_version:0,evidence_ids:[evidence]};
  const record=await service.execute({context,proposal:invoice,source_message_id:source,idempotency_key:'invoice'});expect(record.status).toBe('applied');
  expect((await service.execute({context,proposal:invoice,source_message_id:source,idempotency_key:'invoice-repeat'})).status).toBe('already_applied');
  const stock=async()=>{const row=(await fixture.pool.query<{quantity:string}>('SELECT sum(quantity)::text AS quantity FROM inventory_movements WHERE run_id=$1 AND material_id=$2',[run_id,'00000000-0000-4000-8000-000000000021'])).rows[0];return row?.quantity;};expect(await stock()).toBe('4');
  const purchase=(await service.list(context)).purchases[0];if(!purchase||!purchase.lines[0])throw Error('Missing purchase');expect(purchase.total).toBe('228000');
  const resolved=resolveCommand({type:'confirm_receipt',entity_ids:[{name:'purchase_id',reference:'F-DEMO-001'}],fields_json:JSON.stringify({lines:[{line_id:'cemento',quantity:'6'}]})},await new PgProjectRepository(transactions).snapshot(context),[evidence],hash,null,[purchase]);expect(resolved.type).toBe('confirm_receipt');if(resolved.type==='confirm_receipt')expect(resolved.fields.lines[0]?.line_id).toBe(purchase.lines[0].id);
  const receipt:OperationProposal={type:'confirm_receipt',entity_ids:{purchase_id:purchase.id},fields:{lines:[{line_id:purchase.lines[0].id,quantity:'6'}]},expected_version:record.project_version,evidence_ids:[evidence]};
  const accepted=await service.execute({context,proposal:receipt,source_message_id:'receipt-source',idempotency_key:'receipt'});expect(accepted.status).toBe('applied');
  expect((await service.execute({context,proposal:receipt,source_message_id:'receipt-source',idempotency_key:'receipt'})).status).toBe('already_applied');
  expect((await service.execute({context,proposal:receipt,source_message_id:'new-click',idempotency_key:'new-click'})).status).toBe('already_applied');expect(await stock()).toBe('10');
  expect((await fixture.pool.query('SELECT 1 FROM purchase_receipts')).rowCount).toBe(1);expect((await fixture.pool.query('SELECT 1 FROM inventory_movements WHERE quantity=6 AND run_id=$1',[run_id])).rowCount).toBe(1);
  const workerId=(await fixture.pool.query<{id:string}>("SELECT id FROM members WHERE username='luis'")).rows[0]?.id;if(!workerId)throw Error('Missing worker');const worker={...context,actor_id:workerId,roles:['worker'] as const,permissions:['report:create']};const workerContext:ActorContext={...worker,roles:[...worker.roles]};const visible=await service.list(workerContext);expect(visible.purchases[0]?.total).toBeNull();expect(visible.purchases[0]?.evidence_ids).toEqual([]);expect(visible.can_receive).toBe(false);
  await expect(service.execute({context:workerContext,proposal:receipt,source_message_id:'denied',idempotency_key:'denied'})).rejects.toMatchObject({code:'FORBIDDEN'});
  const conflict:OperationProposal={...invoice,fields:{...invoice.fields,lines:[{...invoice.fields.lines[0]!,quantity:'7'}]}};await expect(service.execute({context,proposal:conflict,source_message_id:source,idempotency_key:'conflict'})).rejects.toMatchObject({code:'CONFLICT'});
 }finally{await fixture.close();}
});
