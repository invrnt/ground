import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import Fastify from 'fastify';
import { PgTransactions } from '../../packages/server/src/infra/database';
import { PgJobQueue } from '../../packages/server/src/infra/jobs';
import { Sessions } from '../../packages/server/src/infra/sessions';
import { LocalPrivateFiles } from '../../packages/server/src/infra/files';
import { isolatedDatabase } from '../../packages/server/src/infra/test-database';
import { configureDemo,seedDemo } from '../../packages/server/src/modules/project/seed';
import { manifestSchema } from '../../packages/server/src/modules/project/manifest';
import { projectModule } from '../../packages/server/src/modules/project';
const connectionString=process.env['DATABASE_URL']; if(!connectionString)throw new Error('DATABASE_URL required');
const fixture=await isolatedDatabase(connectionString); const tx=new PgTransactions(fixture.pool); const manifest=manifestSchema.parse(JSON.parse(await readFile(new URL('../../demo/manifest.json',import.meta.url),'utf8'))); const password=randomUUID();
try { await configureDemo(tx,manifest,Object.fromEntries(manifest.members.map(m=>[m.username,password]))); const run=await seedDemo(tx,manifest); assert.equal(await seedDemo(tx,manifest),run); await configureDemo(tx,manifest,{});
 const projectId='00000000-0000-4000-8000-000000000001'; const id=randomUUID(); await tx.run(t=>new PgJobQueue(tx).enqueue({job_id:id,kind:'process_input',project_id:projectId,run_id:run,operation_id:randomUUID(),dedupe_key:id,payload_version:1,payload:{subject_id:randomUUID(),expected_version:0},status:'pending',attempts:0,available_at:new Date().toISOString(),due_at:null,lease_owner:null,lease_expires_at:null,last_error:null,condition:null,result_reference:null},t));
 const secondPool=new pg.Pool({connectionString,options:fixture.pool.options.options}); try { const queue=new PgJobQueue(new PgTransactions(secondPool)); const job=await queue.claim('restarted-worker',['process_input']); assert.equal(job?.job_id,id); if(job)await queue.settle(job); }finally{await secondPool.end();}
 const sessions=new Sessions(fixture.pool,'http://localhost:3000'); const app=Fastify(); await projectModule(fixture.pool,sessions,new LocalPrivateFiles('/tmp/ground-runtime-test-private')).registerRoutes(app); assert.equal((await app.inject('/api/session')).statusCode,401); assert.equal((await app.inject({method:'POST',url:'/api/session',headers:{origin:'http://evil.invalid'},payload:{username:'ana',password}})).statusCode,403); const login=await app.inject({method:'POST',url:'/api/session',headers:{origin:'http://localhost:3000'},payload:{username:'ana',password}}); assert.equal(login.statusCode,200); assert.equal(login.json().user.username,'ana'); const cookie=login.headers['set-cookie']; assert.equal(typeof cookie,'string'); assert.equal((await app.inject({url:'/api/session',headers:{cookie:String(cookie)}})).statusCode,200); await app.close(); console.info('Runtime fixture: seed twice, configure twice, persisted job reopened, session denial/login passed');
}finally{await fixture.close();}
