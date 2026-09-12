import { readFile } from 'node:fs/promises';
import { createPool,PgTransactions } from '../packages/server/src/infra/database';
import { configureDemo } from '../packages/server/src/modules/project/seed';
import { manifestSchema } from '../packages/server/src/modules/project/manifest';
const manifest=manifestSchema.parse(JSON.parse(await readFile(process.env['DEMO_MANIFEST_PATH']||new URL('../demo/manifest.json',import.meta.url),'utf8')));
const pool=createPool(); try { const passwords=Object.fromEntries(manifest.members.map(m=>[m.username,process.env[`DEMO_PASSWORD_${m.username.toUpperCase()}`]])); console.info({configured:true,pending:await configureDemo(new PgTransactions(pool),manifest,passwords)}); } finally { await pool.end(); }
