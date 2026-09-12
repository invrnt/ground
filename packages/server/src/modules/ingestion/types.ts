import { z } from 'zod';
import { normalizedMessageSchema, type ActorContext, type DomainEvent, type Job, type TransactionContext } from '@ground/contracts';
export const channelProviderSchema = z.enum(['telegram','slack']);
export const inputSchema = z.object({ id: z.string().uuid(), bot_id: z.string(), provider: channelProviderSchema, operation_id: z.string().uuid(), report_id: z.string().uuid().nullable(), status: z.enum(['accepted','awaiting_attachment','ready','failed']), message: normalizedMessageSchema, callback: z.object({ id: z.string(), data: z.string() }).nullable(), error: z.string().nullable() });
export type StoredInput = z.infer<typeof inputSchema>;
export const replySchema = z.object({ id:z.string().uuid(), provider:channelProviderSchema, project_id:z.string().uuid(), run_id:z.string().uuid(), operation_id:z.string().uuid(), input_id:z.string().uuid().nullable(), chat_id:z.string(), reply_to_message_id:z.string().nullable(), text:z.string(), callback_query_id:z.string().nullable(), status:z.enum(['pending','sending','sent','uncertain']), provider_message_id:z.string().nullable() });
export type ChannelReply = z.infer<typeof replySchema>;
export interface IngestionRepository {
  authorize(provider: string, chat: string, sender: string, at: string, tx: TransactionContext, sent_at?: string): Promise<ActorContext>;
  findUpdate(bot: string, update: string, tx: TransactionContext): Promise<StoredInput | null>;
  findMessage(bot: string, chat: string, message: string, run: string, tx: TransactionContext): Promise<StoredInput | null>;
  getInput(id: string, tx: TransactionContext): Promise<StoredInput>;
  insertInput(input: StoredInput, tx: TransactionContext): Promise<void>;
  recordUpdate(bot: string, update: string, input: string, tx: TransactionContext): Promise<void>;
  updateInput(input: StoredInput, tx: TransactionContext): Promise<void>;
  saveMedia(input: StoredInput, tx: TransactionContext): Promise<void>;
  appendEvent(input: StoredInput, type: DomainEvent['type'], tx: TransactionContext): Promise<void>;
  saveReply(reply: ChannelReply, tx: TransactionContext): Promise<void>;
  getReply(id: string, tx: TransactionContext): Promise<ChannelReply>;
  updateReply(reply: ChannelReply, tx: TransactionContext): Promise<void>;
  assertActive(project: string, run: string, tx: TransactionContext): Promise<void>;
}
export interface AuthorizedReplyRouter {
  /** Returns true only after dispatch or clarification has durably handled this input. */
  route(input: StoredInput, actor: ActorContext, tx: TransactionContext): Promise<boolean>;
}
export function ingestionJob(input: StoredInput, kind: Job['kind'], subject: string, dedupe: string, condition: string | null = null): Job {
  return { job_id: crypto.randomUUID(), kind, project_id: input.message.project_id, run_id: input.message.run_id, operation_id: input.operation_id, dedupe_key: dedupe, payload_version: 1, payload: { subject_id: subject, expected_version: 0 }, status: 'pending', attempts: 0, available_at: input.message.received_at, due_at: null, lease_owner: null, lease_expires_at: null, last_error: null, condition, result_reference: null };
}

/** What interpretation needs from a channel: the router and a single service both provide it. */
export interface ChannelReplies {
  enqueueReply(input: StoredInput, text: string, tx: TransactionContext, callback_query_id?: string | null): Promise<string>;
  enqueueCommittedSummary(input: StoredInput, result: { operation_id: string; applied_count: number; pending_count: number; project_version: number }, tx: TransactionContext): Promise<string>;
  linkAttachment(actor: ActorContext, input_id: string, report_input_id: string, tx: TransactionContext): Promise<StoredInput>;
}
