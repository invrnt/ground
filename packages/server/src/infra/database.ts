import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { TransactionContext, TransactionRunner } from '@ground/contracts';
export interface Clock { now(): Date; }
export const systemClock: Clock = { now: () => new Date() };
export class PgTransactions implements TransactionRunner {
 private readonly clients = new Map<string, pg.PoolClient>();
 constructor(readonly pool: pg.Pool) {}
 client(tx: TransactionContext): pg.PoolClient { const client = this.clients.get(tx.transaction_id); if (!client) throw new Error('Inactive transaction'); return client; }
 async run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
  const client = await this.pool.connect(); const tx = {transaction_id: randomUUID()};
  try { await client.query('BEGIN'); this.clients.set(tx.transaction_id, client); const result=await work(tx); await client.query('COMMIT'); return result; }
  catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { this.clients.delete(tx.transaction_id); client.release(); }
 }
}
export function createPool(connectionString = process.env['DATABASE_URL']) { if (!connectionString) throw new Error('DATABASE_URL is required'); return new pg.Pool({connectionString,max:10,connectionTimeoutMillis:5000,statement_timeout:10000}); }
