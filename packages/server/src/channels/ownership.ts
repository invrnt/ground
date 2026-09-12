import type { Job } from '@ground/contracts';
import type { PgTransactions } from '../infra/database';
import type { ChannelProvider } from './registry';

/**
 * Which channel owns a queued job. The answer comes from the row the job points at, so it
 * survives a restart with a different set of channels enabled.
 */
export interface ChannelOwnership { providerOf(job: Job): Promise<ChannelProvider | null> }

const provider = (value: string | undefined): ChannelProvider | null => (value === 'telegram' || value === 'slack' ? value : null);

export class PgChannelOwnership implements ChannelOwnership {
  constructor(private readonly transactions: PgTransactions) {}
  private async one(sql: string, params: readonly unknown[]): Promise<ChannelProvider | null> {
    const row = (await this.transactions.pool.query<{ provider: string }>(sql, [...params])).rows[0];
    return provider(row?.provider);
  }
  async providerOf(job: Job): Promise<ChannelProvider | null> {
    if (job.kind === 'send_channel_reply') {
      /** Media retention points at the input; a reply job points at the reply row. */
      return job.condition === 'intake_media'
        ? this.one('SELECT provider FROM ingestion_inputs WHERE id=$1', [job.payload.subject_id])
        : this.one('SELECT provider FROM ingestion_replies WHERE id=$1', [job.payload.subject_id]);
    }
    if (job.kind === 'dispatch_request') return this.one('SELECT provider FROM outbound_requests WHERE proposal_id=$1 AND proposal_version=$2', [job.payload.subject_id, job.payload.expected_version]);
    if (job.kind === 'follow_up') {
      return job.condition === 'reply_media'
        ? this.one('SELECT provider FROM dispatch_replies WHERE id=$1', [job.payload.subject_id])
        : this.one('SELECT f.provider FROM request_followups f WHERE f.request_id=$1 OR f.id=$1', [job.result_reference ?? job.payload.subject_id]);
    }
    return null;
  }
}
