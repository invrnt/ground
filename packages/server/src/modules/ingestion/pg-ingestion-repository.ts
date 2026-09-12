import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { actorContextSchema, GroundError, type ActorContext, type TransactionContext, type DomainEvent } from '@ground/contracts';
import { inputSchema, replySchema, type StoredInput, type ChannelReply, type IngestionRepository } from './types';

export class PgIngestionRepository implements IngestionRepository {
  constructor(private readonly client: (tx: TransactionContext) => PoolClient) {}
  async authorize(provider: string, chat: string, sender: string, at: string, tx: TransactionContext, sent_at?: string): Promise<ActorContext> {
    const result = await this.client(tx).query(`SELECT m.id AS actor_id, p.id AS project_id, r.id AS run_id, m.roles FROM channel_bindings b JOIN projects p ON p.id=b.project_id JOIN scenario_runs r ON r.project_id=p.id AND r.status='active' JOIN member_channel_identities mi ON mi.project_id=p.id AND mi.provider=$4 AND mi.external_id=$2 JOIN members m ON m.id=mi.member_id WHERE b.provider=$4 AND b.chat_id=$1 AND ($3::timestamptz IS NULL OR date_trunc('second',r.created_at) <= $3::timestamptz) FOR UPDATE OF p,r`, [chat, sender, sent_at ?? null, provider]);
    const row: unknown = result.rows[0];
    if (!row) throw new GroundError('FORBIDDEN', `${provider} conversation or sender is not authorized`);
    const identity = z.object({ actor_id:z.string().uuid(),project_id:z.string().uuid(),run_id:z.string().uuid(),roles:actorContextSchema.shape.roles }).parse(row);
    return actorContextSchema.parse({ ...identity, permissions: ['report:create'], trusted_time: at });
  }
  async assertActive(project: string, run: string, tx: TransactionContext): Promise<void> {
    const result = await this.client(tx).query(`SELECT r.id FROM scenario_runs r JOIN projects p ON p.id=r.project_id WHERE r.id=$1 AND r.project_id=$2 AND r.status='active' FOR UPDATE OF p,r`, [run, project]);
    if (!result.rowCount) throw new GroundError('CONFLICT', 'The input run is no longer active');
  }
  private parse(row: unknown): StoredInput | null { return row ? inputSchema.parse(row) : null; }
  async findUpdate(bot: string, update: string, tx: TransactionContext) {
    const result = await this.client(tx).query('SELECT i.* FROM ingestion_updates u JOIN ingestion_inputs i ON i.id=u.input_id WHERE u.bot_id=$1 AND u.update_id=$2', [bot, update]);
    return this.parse(result.rows[0]);
  }
  async findMessage(bot: string, chat: string, message: string, run: string, tx: TransactionContext) {
    const result = await this.client(tx).query('SELECT i.* FROM ingestion_inputs i WHERE i.bot_id=$1 AND i.chat_id=$2 AND i.run_id=$4 AND (i.message_id=$3 OR EXISTS(SELECT 1 FROM ingestion_replies r WHERE r.input_id=i.id AND r.chat_id=$2 AND r.provider_message_id=$3))', [bot,chat,message,run]);
    return this.parse(result.rows[0]);
  }
  async getInput(id: string, tx: TransactionContext) {
    const result = await this.client(tx).query('SELECT * FROM ingestion_inputs WHERE id=$1 FOR UPDATE', [id]);
    const input = this.parse(result.rows[0]);
    if (!input) throw new GroundError('NOT_FOUND', 'Input not found');
    return input;
  }
  async insertInput(input: StoredInput, tx: TransactionContext) {
    await this.client(tx).query('INSERT INTO ingestion_inputs(id,bot_id,provider,chat_id,message_id,project_id,run_id,operation_id,report_id,status,message,callback,error) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [input.id,input.bot_id,input.provider,input.message.chat_id,input.message.message_id,input.message.project_id,input.message.run_id,input.operation_id,input.report_id,input.status,JSON.stringify(input.message),input.callback ? JSON.stringify(input.callback):null,input.error]);
  }
  async recordUpdate(bot: string, update: string, input: string, tx: TransactionContext) { await this.client(tx).query('INSERT INTO ingestion_updates(bot_id,update_id,input_id) VALUES($1,$2,$3)', [bot,update,input]); }
  async updateInput(input: StoredInput, tx: TransactionContext) { await this.client(tx).query('UPDATE ingestion_inputs SET message=$2,status=$3,error=$4,report_id=$5 WHERE id=$1', [input.id,JSON.stringify(input.message),input.status,input.error,input.report_id]); }
  async saveMedia(input: StoredInput, tx: TransactionContext) {
    for (const media of input.message.media) {
      if (!media.sha256 || media.size_bytes === null) continue;
      await this.client(tx).query('INSERT INTO private_files(id,project_id,run_id,content_type,sha256,size_bytes,restricted) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING', [media.id,input.message.project_id,input.message.run_id,media.mime_type,media.sha256,media.size_bytes,media.kind === 'document']);
    }
  }
  async appendEvent(input: StoredInput, type: DomainEvent['type'], tx: TransactionContext) {
    const result = await this.client(tx).query('UPDATE projects SET event_sequence=event_sequence+1 WHERE id=$1 RETURNING event_sequence,version', [input.message.project_id]);
    const row = z.object({ event_sequence:z.coerce.number(),version:z.coerce.number() }).parse(result.rows[0]);
    await this.client(tx).query('INSERT INTO domain_events(event_id,project_id,run_id,sequence,project_version,operation_id,type,occurred_at,evidence_ids,payload,schema_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)', [randomUUID(),input.message.project_id,input.message.run_id,row.event_sequence,row.version,input.operation_id,type,new Date().toISOString(),input.message.media.map(m=>m.id),JSON.stringify({ entity_id:input.id,entity_version:row.version,summary:type === 'attachment.linked' ? 'Evidence linked to report' : 'Telegram input received',changed_fields:['input'] })]);
  }
  async saveReply(reply: ChannelReply, tx: TransactionContext) {
    await this.client(tx).query('INSERT INTO ingestion_replies(id,provider,project_id,run_id,operation_id,input_id,chat_id,reply_to_message_id,text,callback_query_id,status,provider_message_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [reply.id,reply.provider,reply.project_id,reply.run_id,reply.operation_id,reply.input_id,reply.chat_id,reply.reply_to_message_id,reply.text,reply.callback_query_id,reply.status,reply.provider_message_id]);
  }
  async getReply(id: string, tx: TransactionContext) {
    const result = await this.client(tx).query('SELECT * FROM ingestion_replies WHERE id=$1 FOR UPDATE', [id]);
    if (!result.rows[0]) throw new GroundError('NOT_FOUND', 'Channel reply not found');
    return replySchema.parse(result.rows[0]);
  }
  async updateReply(reply: ChannelReply, tx: TransactionContext) { await this.client(tx).query('UPDATE ingestion_replies SET status=$2,provider_message_id=$3 WHERE id=$1', [reply.id,reply.status,reply.provider_message_id]); }
}
