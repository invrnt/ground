import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { GroundError, type ActorContext, type Job, type TransactionContext } from '@ground/contracts';
import { BotTelegramAdapter } from '../../adapters/telegram/telegram-adapter';
import { IngestionService } from './ingestion-service';
import type { ChannelReply, IngestionRepository, StoredInput } from './types';

// A typed double permits authoring before runtime merges. The database case below
// uses the same assertion group after integration, not a second provider journey.
function fixture() {
  const inputs = new Map<string, StoredInput>();
  const updates = new Map<string, string>();
  const replies = new Map<string, ChannelReply>();
  const jobs: Job[] = [];
  const project_id = randomUUID(), run_id = randomUUID();
  const tx: TransactionContext = { transaction_id: randomUUID() };
  const repository: IngestionRepository = {
    authorize: async (provider, chat, sender, at) => {
      if (provider !== 'telegram' || chat !== '-10' || !['1','2'].includes(sender)) throw new GroundError('FORBIDDEN', 'Unauthorized');
      return { actor_id: randomUUID(), project_id, run_id, roles: ['worker'], permissions: ['report:create'], trusted_time: at } satisfies ActorContext;
    },
    findUpdate: async (bot, update) => inputs.get(updates.get(`${bot}:${update}`) ?? '') ?? null,
    findMessage: async (bot, chat, message, run) => [...inputs.values()].find(i => i.bot_id === bot && i.message.chat_id === chat && i.message.message_id === message && i.message.run_id === run) ?? null,
    getInput: async id => { const input = inputs.get(id); if (!input) throw Error('Missing input'); return input; },
    insertInput: async input => { inputs.set(input.id, input); },
    recordUpdate: async (bot, update, id) => { updates.set(`${bot}:${update}`, id); },
    updateInput: async input => { inputs.set(input.id, input); },
    appendEvent: async () => {},
    saveMedia: async () => {},
    saveReply: async reply => { replies.set(reply.id, reply); },
    getReply: async id => { const reply = replies.get(id); if (!reply) throw Error('Missing reply'); return reply; },
    updateReply: async reply => { replies.set(reply.id, reply); },
    assertActive: async () => {},
  };
  const adapter = new BotTelegramAdapter({ token:'test-token', webhook_secret:'test-secret' }, async () => { throw Error('No provider calls allowed'); });
  const service = new IngestionService({ bot_id:'test-bot', adapter, repository, transactions:{ run: work => work(tx) }, queue:{ enqueue:async job => { if (!jobs.some(j => j.dedupe_key === job.dedupe_key)) jobs.push(job); } }, files:{ put:async () => {}, read:async () => new Uint8Array(), remove:async () => {} } });
  return { service, inputs, jobs };
}
const text = (update_id: number, message_id: number, sender: number) => ({ update_id, message:{ message_id, date:1800000000, chat:{id:-10}, from:{id:sender}, text:'Terminamos el enchape.' } });

describe('ingestion critical invariants', () => {
  it('accepts three duplicate deliveries once and retains the late photo author and explicit report', async () => {
    const { service, inputs, jobs } = fixture();
    const raw = text(10,100,1);
    const first = await service.accept('test-secret',raw);
    expect((await service.accept('test-secret',raw)).id).toBe(first.id);
    expect((await service.accept('test-secret',raw)).id).toBe(first.id);
    expect(inputs.size).toBe(1);
    expect(jobs.filter(j=>j.kind==='process_input')).toHaveLength(1);
    await service.accept('test-secret',text(11,101,2));
    const photo = await service.accept('test-secret',{ update_id:12, message:{ message_id:102,date:1800000001,chat:{id:-10},from:{id:2},reply_to_message:{message_id:100},photo:[{file_id:'photo',file_unique_id:'unique-photo',file_size:100}] } });
    expect(photo.report_id).toBe(first.report_id);
    expect(photo.message.sender_id).toBe('2');
    expect(photo.operation_id).not.toBe(first.operation_id);
    expect(jobs.filter(j=>j.kind==='process_input')).toHaveLength(2);
    const orphan = await service.accept('test-secret',{ update_id:13,message:{message_id:103,date:1800000002,chat:{id:-10},from:{id:1},photo:[{file_id:'orphan',file_unique_id:'orphan'}]} });
    expect(orphan.report_id).toBeNull();
    expect(orphan.status).toBe('awaiting_attachment');
    await expect(service.accept('wrong',text(14,104,1))).rejects.toMatchObject({code:'UNAUTHORIZED'});
    await expect(service.accept('test-secret',text(14,104,999))).rejects.toMatchObject({code:'FORBIDDEN'});
  });
  it('does not retry a reply whose provider outcome is uncertain', async () => {
    const { service, jobs } = fixture();
    await service.accept('test-secret',text(10,100,1));
    const reply = jobs.find(job=>job.kind==='send_channel_reply');
    if (!reply) throw Error('Missing receipt');
    await expect(service.handleJob(reply)).rejects.toMatchObject({code:'UNCERTAIN'});
    await expect(service.handleJob(reply)).rejects.toMatchObject({code:'UNCERTAIN'});
  });
});

// Opt in with TEST_DATABASE_URL; isolatedDatabase creates and drops its own schema.
import { isolatedDatabase } from '../../infra/test-database';
import { PgTransactions } from '../../infra/database';
import { PgJobQueue } from '../../infra/jobs';
import { PgIngestionRepository } from './pg-ingestion-repository';
import { jobSchema } from '@ground/contracts';

it.skipIf(!process.env['TEST_DATABASE_URL'])('persists concurrent duplicates and late-photo association in isolated PostgreSQL', async () => {
  const url = process.env['TEST_DATABASE_URL'];
  if (!url) throw Error('TEST_DATABASE_URL is required');
  const database = await isolatedDatabase(url);
  try {
    const project = randomUUID(), run = randomUUID();
    await database.pool.query("INSERT INTO projects(id,name) VALUES($1,'Intake test')", [project]);
    await database.pool.query("INSERT INTO scenario_runs(id,project_id,status,scenario_version,scenario_date,created_at) VALUES($1,$2,'active','test','2026-09-12','2026-01-01')", [run,project]);
    await database.pool.query("INSERT INTO channel_bindings(chat_id,project_id) VALUES('-10',$1)", [project]);
    for (const sender of ['1','2']) await database.pool.query("INSERT INTO members(id,project_id,username,display_name,password_hash,roles,telegram_sender_id) VALUES($1,$2,$3,$3,'unused',ARRAY['worker'],$4)", [randomUUID(),project,`test-${sender}`,sender]);
    const transactions = new PgTransactions(database.pool);
    const repository = new PgIngestionRepository(tx=>transactions.client(tx));
    const queue = new PgJobQueue(transactions);
    let downloads = 0;
    const adapter = new BotTelegramAdapter({token:'test-token',webhook_secret:'test-secret'}, async url => {
      if (String(url).endsWith('/getFile')) return Response.json({ok:true,result:{file_path:'photos/test.jpg',file_size:4}});
      if (String(url).includes('/file/')) { downloads++; return new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]),{headers:{'content-type':'image/jpeg'}}); }
      throw Error('No sends in database check');
    });
    const service = new IngestionService({bot_id:'test-bot',adapter,repository,transactions,queue,files:{put:async()=>{},read:async()=>new Uint8Array(),remove:async()=>{}}});
    const results = await Promise.all([1,2,3].map(()=>service.accept('test-secret',text(10,100,1))));
    const first = results[0]; if (!first) throw Error('Missing first input');
    expect(new Set(results.map(result=>result.id)).size).toBe(1);
    expect((await database.pool.query('SELECT count(*)::int AS count FROM ingestion_inputs')).rows[0]?.count).toBe(1);
    expect((await database.pool.query("SELECT count(*)::int AS count FROM scheduled_jobs WHERE kind='process_input'")).rows[0]?.count).toBe(1);
    await service.accept('test-secret',text(11,101,2));
    const photo = await service.accept('test-secret',{update_id:12,message:{message_id:102,date:1800000001,chat:{id:-10},from:{id:2},reply_to_message:{message_id:100},photo:[{file_id:'photo',file_unique_id:'photo',file_size:4}]}});
    const row = (await database.pool.query<Record<string, unknown>>("SELECT * FROM scheduled_jobs WHERE condition='intake_media' AND payload->>'subject_id'=$1",[photo.id])).rows[0];
    if (!row || !(row['available_at'] instanceof Date)) throw Error('Missing media job');
    const { desired_job: _desiredJob, ...publicJob } = row;
    const job = jobSchema.parse({...publicJob,available_at:row['available_at'].toISOString(),due_at:null,lease_expires_at:null});
    await service.handleJob(job);
    await service.handleJob(job);
    const retained = await transactions.run(tx=>repository.getInput(photo.id,tx));
    expect(retained.report_id).toBe(first.report_id);
    expect(retained.message.sender_id).toBe('2');
    expect(retained.message.media[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(downloads).toBe(1);
    expect((await database.pool.query("SELECT count(*)::int AS count FROM scheduled_jobs WHERE kind='process_input'")).rows[0]?.count).toBe(2);
    expect((await database.pool.query("SELECT count(*)::int AS count FROM scheduled_jobs WHERE kind='sync_attachment'")).rows[0]?.count).toBe(1);
    expect((await database.pool.query('SELECT count(*)::int AS count FROM private_files')).rows[0]?.count).toBe(1);
    await expect(service.accept('test-secret',{...text(20,120,1),message:{...text(20,120,1).message,date:1700000000}})).rejects.toMatchObject({code:'FORBIDDEN'});
  } finally { await database.close(); }
});
