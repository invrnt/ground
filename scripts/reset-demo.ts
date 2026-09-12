import { createPool,PgTransactions } from '../packages/server/src/infra/database';
import { PgJobQueue } from '../packages/server/src/infra/jobs';
import { OperationsService } from '../packages/server/src/modules/operations';
import { demoProjectId } from '../packages/server/src/modules/project/seed';
const run=process.argv[2],confirmation=process.argv[3],username=process.env['DEMO_ADMIN_USERNAME']??'admin';
if(!run||confirmation!==`RESET ${run}`)throw new Error('Usage: pnpm demo:reset <run-id> "RESET <run-id>"');
const pool=createPool(),transactions=new PgTransactions(pool),operations=new OperationsService({transactions,queue:new PgJobQueue(transactions)});
try{const member=await pool.query<{id:string}>("SELECT id FROM members WHERE project_id=$1 AND username=$2 AND 'admin'=ANY(roles)",[demoProjectId,username]);if(!member.rows[0])throw new Error('Provisioned demo admin required');const result=await operations.reset(await operations.context(member.rows[0].id,demoProjectId,run),{expected_run_id:run,confirmation});console.info(result);if(result.status==='blocked')process.exitCode=1;}finally{await pool.end();}
