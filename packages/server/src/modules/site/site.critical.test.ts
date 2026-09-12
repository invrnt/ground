import { describe,it,expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { reportedProgress,materialNeed } from '@ground/domain';
import { SiteService } from './site-service';
import { PgTransactions } from '../../infra/database';
import { PgJobQueue } from '../../infra/jobs';
import { isolatedDatabase } from '../../infra/test-database';
import { configureDemo,seedDemo,demoProjectId } from '../project/seed';
import { manifestSchema } from '../project/manifest';
import type { ActorContext,OperationProposal } from '@ground/contracts';
describe('site critical invariants',()=>{
 it('uses exact scenario arithmetic',()=>{expect(reportedProgress([{weight:'62',status:'completed'},{weight:'19',status:'completed'},{weight:'19',status:'pending'}])).toBe('81');expect(materialNeed({area:'22.5',allowance:'0.10',coverage:'1.26',usable:'0',committed:'0'})).toBe('20');});
 it.skipIf(!process.env['TEST_DATABASE_URL'])('serializes stock, deduplicates milestones and appends compensation',async()=>{
 const fixture=await isolatedDatabase(process.env['TEST_DATABASE_URL']!); const transactions=new PgTransactions(fixture.pool); const service=new SiteService({transactions,queue:new PgJobQueue(transactions)});
 try { const manifest=manifestSchema.parse(JSON.parse(await readFile(new URL('../../../../../demo/manifest.json',import.meta.url),'utf8')));await configureDemo(transactions,manifest,Object.fromEntries(manifest.members.map(m=>[m.username,randomUUID()])));const run_id=await seedDemo(transactions,manifest);const member=await fixture.pool.query<{id:string}>("SELECT id FROM members WHERE username='luis'");const actor_id=member.rows[0]!.id;const context:ActorContext={actor_id,project_id:demoProjectId,run_id,roles:['worker'],permissions:['report:create'],trusted_time:new Date().toISOString()};
 const work=await fixture.pool.query<{id:string}>("SELECT id FROM work_items WHERE name='Bathroom tiling' AND run_id=$1",[run_id]);const workId=work.rows[0]!.id;const source=randomUUID();const execute=(proposal:OperationProposal,key:string=randomUUID())=>service.execute({context,proposal,source_message_id:source,idempotency_key:key});
 const milestone:OperationProposal={type:'complete_work_item',entity_ids:{work_item_id:workId},fields:{},evidence_ids:[],expected_version:0};const first=await execute(milestone,'milestone');expect(first.status).toBe('applied');expect((await execute(milestone,'milestone')).status).toBe('already_applied');expect((await execute({...milestone,expected_version:1})).status).toBe('already_applied');
 const consume=(quantity:string,version:number):OperationProposal=>({type:'consume_material',entity_ids:{material_id:'00000000-0000-4000-8000-000000000020',location_id:'00000000-0000-4000-8000-000000000010'},fields:{quantity,unit:'box'},evidence_ids:[],expected_version:version});expect((await execute(consume('9',1))).status).toBe('needs_input');
 const results=await Promise.all([execute(consume('8',1)),execute(consume('8',1))]);expect(results.map(r=>r.status).sort()).toEqual(['applied','conflict']);const applied=results.find(r=>r.status==='applied')!;const stock=async()=>{const q=await fixture.pool.query<{quantity:string}>('SELECT sum(quantity)::text AS quantity FROM inventory_movements WHERE run_id=$1 AND material_id=$2',[run_id,'00000000-0000-4000-8000-000000000020']);return q.rows[0]!.quantity;};expect(await stock()).toBe('0');const needs=await fixture.pool.query<{net_quantity:string}>('SELECT net_quantity::text FROM procurement_needs WHERE run_id=$1',[run_id]);expect(needs.rows[0]!.net_quantity).toBe('20');
 const correction=await execute({type:'correct_operation',entity_ids:{original_operation_id:applied.operation_id},fields:{quantity:'7',reason:'Corrected report'},evidence_ids:[],expected_version:2},'correction');expect(correction.status).toBe('applied');expect(await stock()).toBe('1');expect((await fixture.pool.query<{net_quantity:string}>('SELECT net_quantity::text FROM procurement_needs WHERE run_id=$1',[run_id])).rows[0]!.net_quantity).toBe('19');expect((await fixture.pool.query('SELECT 1 FROM inventory_movements WHERE run_id=$1 AND quantity=-8',[run_id])).rowCount).toBe(1);
 }finally{await fixture.close();}
 });
});
