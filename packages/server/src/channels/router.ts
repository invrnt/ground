import { GroundError, type ActorContext, type Job, type TransactionContext } from '@ground/contracts';
import type { IngestionService, StoredInput } from '../modules/ingestion';
import type { DispatchService } from '../modules/dispatch';
import type { ChannelDefinition, ChannelProvider } from './registry';
import type { ChannelOwnership } from './ownership';

/** A channel and the two services bound to its adapter for the life of the process. */
export interface ChannelRuntime extends ChannelDefinition { readonly ingestion: IngestionService; readonly dispatch: DispatchService }

/**
 * Sends work to the channel that owns it.
 *
 * Ownership is read from the row the job points at, not from whichever channels happen to
 * be enabled now. A job belonging to a channel that is switched off is left pending: it is
 * neither delivered through another provider's adapter, which would reach the wrong
 * workspace, nor quietly marked done, which would lose it when the channel comes back.
 */
export class ChannelRouter {
  private readonly byProvider = new Map<ChannelProvider, ChannelRuntime>();
  private readonly byBotId = new Map<string, ChannelRuntime>();
  constructor(runtimes: readonly ChannelRuntime[], private readonly ownership: ChannelOwnership) {
    for (const runtime of runtimes) {
      if (this.byProvider.has(runtime.provider)) throw new GroundError('NOT_READY', `Channel ${runtime.provider} is registered twice`);
      this.byProvider.set(runtime.provider, runtime);
      this.byBotId.set(runtime.bot_id, runtime);
    }
  }
  get channels(): readonly ChannelRuntime[] { return [...this.byProvider.values()]; }
  get providers(): readonly ChannelProvider[] { return [...this.byProvider.keys()]; }
  has(provider: ChannelProvider): boolean { return this.byProvider.has(provider); }
  forInput(input: StoredInput): ChannelRuntime {
    const runtime = this.byBotId.get(input.bot_id);
    if (!runtime) throw new GroundError('NOT_READY', `No channel is configured for bot ${input.bot_id}`);
    return runtime;
  }
  forProvider(provider: ChannelProvider): ChannelRuntime {
    const runtime = this.byProvider.get(provider);
    if (!runtime) throw new GroundError('NOT_READY', `Channel ${provider} is not configured`);
    return runtime;
  }

  /** Reply facade. Interpretation holds one of these; the input says which channel it came from. */
  enqueueReply(input: StoredInput, text: string, tx: TransactionContext, callback_query_id: string | null = null): Promise<string> {
    return this.forInput(input).ingestion.enqueueReply(input, text, tx, callback_query_id);
  }
  enqueueCommittedSummary(input: StoredInput, result: { operation_id: string; applied_count: number; pending_count: number; project_version: number }, tx: TransactionContext): Promise<string> {
    return this.forInput(input).ingestion.enqueueCommittedSummary(input, result, tx);
  }
  linkAttachment(actor: ActorContext, input_id: string, report_input_id: string, tx: TransactionContext): Promise<StoredInput> {
    /** Linking only touches rows, so any configured channel resolves it identically. */
    const runtime = this.channels[0];
    if (!runtime) throw new GroundError('NOT_READY', 'No channel is configured');
    return runtime.ingestion.linkAttachment(actor, input_id, report_input_id, tx);
  }

  /**
   * Resolves the owning channel and runs the job there. A retryable error keeps the job
   * pending for a provider that is not running; a row that has vanished is not an error.
   */
  private async run(job: Job, work: (runtime: ChannelRuntime) => Promise<void>): Promise<void> {
    const provider = await this.ownership.providerOf(job);
    if (!provider) return;
    const runtime = this.byProvider.get(provider);
    if (!runtime) throw new GroundError('NOT_READY', `Channel ${provider} owns this job but is not running`, true);
    await work(runtime);
  }
  handleIngestionJob(job: Job): Promise<void> { return this.run(job, runtime => runtime.ingestion.handleJob(job)); }
  handleDispatchJob(job: Job): Promise<void> { return this.run(job, runtime => runtime.dispatch.handle(job)); }
  handleFollowupJob(job: Job): Promise<void> { return this.run(job, runtime => runtime.dispatch.followup(job)); }
}
