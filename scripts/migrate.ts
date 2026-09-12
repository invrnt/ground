import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
const connectionString = process.env['DATABASE_URL'];
if (!connectionString) throw new Error('DATABASE_URL is required');
const client = new pg.Client({ connectionString });
await client.connect();
try {
 await client.query('BEGIN');
 await client.query('SELECT pg_advisory_xact_lock(784332001)');
 await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 const directory = fileURLToPath(new URL('../packages/server/migrations/', import.meta.url));
 for (const name of (await readdir(directory)).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
  const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name]);
  if (applied.rowCount) continue;
  await client.query(await readFile(`${directory}/${name}`, 'utf8'));
  await client.query('INSERT INTO schema_migrations(name) VALUES ($1)',[name]);
  console.info(`Applied ${name}`);
 }
 await client.query('COMMIT');
} catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
