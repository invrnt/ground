import { createPool,PgTransactions } from '../packages/server/src/infra/database';
import { PgJobQueue } from '../packages/server/src/infra/jobs';
import { OperationsService } from '../packages/server/src/modules/operations';
import { demoProjectId } from '../packages/server/src/modules/project/seed';
if(process.argv[2])throw new Error('Use demo:configure, demo:seed or demo:reset directly.');
const pool=createPool(),transactions=new PgTransactions(pool),operations=new OperationsService({transactions,queue:new PgJobQueue(transactions)});
try{const member=await pool.query<{id:string}>("SELECT id FROM members WHERE project_id=$1 AND 'admin'=ANY(roles) LIMIT 1",[demoProjectId]);if(!member.rows[0])throw new Error('Run migrations, demo:configure and demo:seed first');const status=await operations.status(await operations.context(member.rows[0].id,demoProjectId));console.info({ready:status.ready,run_id:status.run_id,run_status:status.run_status,worker_seen_at:status.worker_seen_at,providers:status.providers,configuration_problems:status.configuration_problems,unsettled:status.unsettled,budget:status.budget});if(!status.ready)process.exitCode=1;}finally{await pool.end();}
