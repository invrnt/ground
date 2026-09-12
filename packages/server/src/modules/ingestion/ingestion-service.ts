import { randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { GroundError, type ActorContext, type Job, type JobQueue, type PrivateFileStore, type TransactionRunner, type TransactionContext } from '@ground/contracts';
import type { BotTelegramAdapter } from '../../adapters/telegram/telegram-adapter';
import { ingestionJob, type IngestionRepository, type StoredInput, type ChannelReply, type AuthorizedReplyRouter } from './types';

export class IngestionService {
  constructor(private readonly deps: { bot_id: string; adapter: BotTelegramAdapter; repository: IngestionRepository; transactions: TransactionRunner; queue: JobQueue; files: PrivateFileStore; router?: AuthorizedReplyRouter; now?: () => string }) {}
  async accept(secret: unknown, raw: unknown): Promise<StoredInput> {
    const { adapter, repository: repo, transactions, queue } = this.deps;
    adapter.verifyWebhook(secret);
    const incoming = adapter.inspectUpdate(raw);
    const now = this.deps.now?.() ?? new Date().toISOString();
    return transactions.run(async tx => {
      const actor = await repo.authorize(incoming.chat_id, incoming.sender_id, now, tx, incoming.sent_at);
      const duplicate = await repo.findUpdate(this.deps.bot_id, incoming.update_id, tx);
      if (duplicate) return duplicate;
      const existing = await repo.findMessage(this.deps.bot_id, incoming.chat_id, incoming.message_id, actor.run_id, tx);
      if (existing) { await repo.recordUpdate(this.deps.bot_id, incoming.update_id, existing.id, tx); return existing; }
      const message = adapter.normalizeUpdate(raw, { project_id: actor.project_id, run_id: actor.run_id }, now);
      const reply = message.reply_to_message_id ? await repo.findMessage(this.deps.bot_id, message.chat_id, message.reply_to_message_id, actor.run_id, tx) : null;
      const attachment = message.media.some(m => m.kind === 'photo');
      const error = adapter.intakeError(raw);
      const id = randomUUID();
      const input: StoredInput = { id, bot_id: this.deps.bot_id, operation_id: randomUUID(), report_id: attachment ? reply?.report_id ?? null : reply?.report_id ?? id, status: error ? 'failed' : attachment && !reply?.report_id ? 'awaiting_attachment' : 'accepted', message, callback: incoming.callback, error };
      await repo.insertInput(input, tx);
      await repo.recordUpdate(this.deps.bot_id, incoming.update_id, id, tx);
      await repo.appendEvent(input, 'input.received', tx);
      await this.enqueueReply(input, error ?? (input.status === 'awaiting_attachment' ? 'Recibí tu foto. Responde al reporte correspondiente para vincularla.' : 'Recibí tu reporte. Está guardado y pendiente de procesamiento.'), tx, incoming.callback?.id ?? null);
      if (!error) {
        if (message.media.length) await queue.enqueue(ingestionJob(input, 'send_channel_reply', id, `media:${id}`, 'intake_media'), tx);
        else await this.scheduleInput(input, tx);
      }
      return input;
    });
  }
  /** Interpretation calls this only after an authorized, explicit clarification answer. */
  async linkAttachment(actor: ActorContext, input_id: string, report_input_id: string, tx: TransactionContext): Promise<StoredInput> {
    const repo = this.deps.repository;
    await repo.assertActive(actor.project_id, actor.run_id, tx);
    const input = await repo.getInput(input_id, tx);
    const report = await repo.getInput(report_input_id, tx);
    if (!actor.permissions.includes('report:create') || [input,report].some(row => row.message.project_id !== actor.project_id || row.message.run_id !== actor.run_id)) throw new GroundError('FORBIDDEN', 'Attachment scope mismatch');
    if (input.report_id === report.report_id && input.report_id !== null) return input;
    if (input.status !== 'awaiting_attachment' || !input.message.media.some(media => media.kind === 'photo') || !report.report_id) throw new GroundError('CONFLICT', 'Attachment cannot be linked');
    input.report_id = report.report_id;
    input.status = input.message.media.every(media => media.sha256 !== null) ? 'ready' : 'accepted';
    await repo.updateInput(input, tx);
    if (input.status === 'ready') await this.scheduleInput(input, tx);
    return input;
  }
  private async scheduleInput(input: StoredInput, tx: TransactionContext): Promise<void> {
    if (input.status === 'awaiting_attachment') return;
    if (input.message.media.some(m => m.kind === 'photo') && input.report_id && input.report_id !== input.id) {
      await this.deps.repository.appendEvent(input, 'attachment.linked', tx);
      for (const media of input.message.media) await this.deps.queue.enqueue(ingestionJob(input, 'sync_attachment', media.id, `attachment:${input.message.run_id}:${media.id}:${media.sha256 ?? ''}`), tx);
      return;
    }
    const actor = await this.deps.repository.authorize(input.message.chat_id, input.message.sender_id, input.message.received_at, tx);
    if (this.deps.router && await this.deps.router.route(input, actor, tx)) return;
    await this.deps.queue.enqueue(ingestionJob(input, 'process_input', input.id, `telegram:${input.bot_id}:${input.message.update_id}`), tx);
  }
  async enqueueReply(input: StoredInput, text: string, tx: TransactionContext, callback_query_id: string | null = null): Promise<string> {
    const id = randomUUID();
    const reply: ChannelReply = { id, input_id: input.id, project_id: input.message.project_id, run_id: input.message.run_id, operation_id: input.operation_id, chat_id: input.message.chat_id, reply_to_message_id: input.callback ? null : input.message.message_id, text, callback_query_id, status: 'pending', provider_message_id: null };
    await this.deps.repository.saveReply(reply, tx);
    await this.deps.queue.enqueue(ingestionJob(input, 'send_channel_reply', id, `reply:${id}`), tx);
    return id;
  }
  /** Only committed public operational facts belong here. Restricted DTOs have no fields in this API. */
  async enqueueCommittedSummary(input: StoredInput, result: { operation_id: string; applied_count: number; pending_count: number; project_version: number }, tx: TransactionContext): Promise<string> {
    if (![result.applied_count, result.pending_count, result.project_version].every(n => Number.isSafeInteger(n) && n >= 0)) throw new GroundError('VALIDATION_ERROR', 'Invalid committed summary');
    return this.enqueueReply({ ...input, operation_id: result.operation_id }, `Registré ${result.applied_count} cambios en la obra. Quedan ${result.pending_count} acciones pendientes. Versión del proyecto: ${result.project_version}.`, tx);
  }
  async handleJob(job: Job): Promise<void> {
    if (job.condition === 'intake_media') return this.retainMedia(job);
    const { repository: repo, transactions, adapter } = this.deps;
    const reply = await transactions.run(async tx => {
      await repo.assertActive(job.project_id, job.run_id, tx);
      const row = await repo.getReply(job.payload.subject_id, tx);
      if (row.project_id !== job.project_id || row.run_id !== job.run_id) throw new GroundError('FORBIDDEN', 'Reply job scope mismatch');
      if (row.status === 'sent') return null;
      if (row.status !== 'pending') throw new GroundError('UNCERTAIN', 'Reply delivery requires reconciliation');
      row.status = 'sending';
      await repo.updateReply(row, tx);
      return row;
    });
    if (!reply) return;
    try {
      if (reply.callback_query_id) await adapter.answerCallback(reply.callback_query_id, reply.text);
      else {
        const sent = await adapter.sendMessage({ recipient_id: reply.chat_id, text: reply.text, ...(reply.reply_to_message_id ? { reply_to_message_id: reply.reply_to_message_id } : {}) });
        reply.provider_message_id = sent.message_id;
      }
      reply.status = 'sent';
      await transactions.run(tx => repo.updateReply(reply, tx));
    } catch (error) {
      reply.status = error instanceof GroundError && error.code !== 'UNCERTAIN' ? 'pending' : 'uncertain';
      await transactions.run(tx => repo.updateReply(reply, tx));
      throw error;
    }
  }
  private async retainMedia(job: Job): Promise<void> {
    const { repository: repo, transactions, adapter, files } = this.deps;
    const input = await transactions.run(async tx => { await repo.assertActive(job.project_id, job.run_id, tx); return repo.getInput(job.payload.subject_id, tx); });
    if (input.message.project_id !== job.project_id || input.message.run_id !== job.run_id) throw new GroundError('FORBIDDEN', 'Input job scope mismatch');
    if (input.status === 'ready' || input.status === 'failed') return;
    try {
      for (const media of input.message.media) {
        const file = await adapter.downloadFile(media.provider_file_id);
        const bytes = file.bytes;
        const prefix = Buffer.from(bytes.subarray(0, 16));
        const mime = media.kind === 'photo' && prefix[0] === 0xff && prefix[1] === 0xd8 ? 'image/jpeg' : media.kind === 'document' && prefix.toString().startsWith('%PDF-') ? 'application/pdf' : media.kind === 'audio' && (prefix.toString().startsWith('OggS') || prefix.toString().startsWith('ID3') || prefix[0] === 0xff || prefix.toString().startsWith('RIFF') || prefix.toString().includes('ftyp')) ? media.mime_type : null;
        if (!mime) throw new GroundError('VALIDATION_ERROR', 'El formato del archivo no coincide con su contenido.');
        await files.put({ id: media.id, bytes, content_type: mime, sha256: file.sha256 });
        media.sha256 = file.sha256;
        media.size_bytes = bytes.byteLength;
        media.mime_type = mime;
        if (mime === 'application/pdf') {
          let pdf: PDFDocument;
          try { pdf = await PDFDocument.load(bytes); } catch { throw new GroundError('VALIDATION_ERROR', 'No pude leer el PDF. Envía un archivo legible sin contraseña.'); }
          if (pdf.getPageCount() > 5) throw new GroundError('VALIDATION_ERROR', 'El PDF debe tener como máximo cinco páginas.');
        }
      }
    } catch (error) {
      if (!(error instanceof GroundError) || error.code !== 'VALIDATION_ERROR') throw error;
      input.status = 'failed'; input.error = error.message;
      await transactions.run(async tx => { await repo.assertActive(job.project_id, job.run_id, tx); await repo.updateInput(input, tx); await repo.saveMedia(input, tx); await this.enqueueReply(input, error.message, tx); });
      return;
    }
    await transactions.run(async tx => {
      await repo.assertActive(job.project_id, job.run_id, tx);
      if (input.status !== 'awaiting_attachment') input.status = 'ready';
      await repo.updateInput(input, tx);
      await repo.saveMedia(input, tx);
      await this.scheduleInput(input, tx);
    });
  }
}
