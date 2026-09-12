import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile,readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
/** Isolated real PostgreSQL schema. Never shares demo rows. Caller must close. */
export async function isolatedDatabase(connectionString:string) { const schema=`test_${randomUUID().replaceAll('-','')}`; const admin=new pg.Client({connectionString}); await admin.connect(); await admin.query(`CREATE SCHEMA ${schema}`); const pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`}); const directory=fileURLToPath(new URL('../../migrations/',import.meta.url)); try { for(const file of (await readdir(directory)).filter(n=>/^\d+.*\.sql$/.test(n)).sort())await pool.query(await readFile(`${directory}/${file}`,'utf8')); } catch(error) { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); throw error; } return {pool,close:async()=> { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }}; }
