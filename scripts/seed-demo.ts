import { readFile } from 'node:fs/promises';
import { createPool,PgTransactions } from '../packages/server/src/infra/database';
import { seedDemo } from '../packages/server/src/modules/project/seed';
import { manifestSchema } from '../packages/server/src/modules/project/manifest';
const manifest=manifestSchema.parse(JSON.parse(await readFile(process.env['DEMO_MANIFEST_PATH']??new URL('../demo/manifest.json',import.meta.url),'utf8')));
const pool=createPool(); try { console.info({run_id:await seedDemo(new PgTransactions(pool),manifest)}); } finally { await pool.end(); }
