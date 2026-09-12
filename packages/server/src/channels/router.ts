import { GroundError, type ActorContext, type Job, type TransactionContext } from '@ground/contracts';
import type { IngestionService, StoredInput } from '../modules/ingestion';
import type { DispatchService } from '../modules/dispatch';
import type { ChannelDefinition, ChannelProvider } from './registry';

/** A channel and the two services bound to its adapter for the life of the process. */
export interface ChannelRuntime extends ChannelDefinition { readonly ingestion: IngestionService; readonly dispatch: DispatchService }

/**
 * Sends work to the channel that owns it.
 *
 * Every persisted row records the provider that created it, so the owner of a job is a
 * property of the data rather than of whichever channel happens to be configured now.
 * A job whose provider is no longer running is left alone instead of being sent through
 * the wrong adapter, which would deliver a supplier request to the wrong workspace.
 */
export class ChannelRouter {
  private readonly byProvider = new Map<ChannelProvider, ChannelRuntime>();
  private readonly byBotId = new Map<string, ChannelRuntime>();
  constructor(runtimes: readonly ChannelRuntime[]) {
    for (const runtime of runtimes) {
      if (this.byProvider.has(runtime.provider)) throw new GroundError('NOT_READY', `Channel ${runtime.provider} is registered twice`);
      this.byProvider.set(runtime.provider, runtime);
      this.byBotId.set(runtime.bot_id, runtime);
    }
  }
  get channels(): readonly ChannelRuntime[] { return [...this.byProvider.values()]; }
  get providers(): readonly ChannelProvider[] { return [...this.byProvider.keys()]; }
  has(provider: ChannelProvider): boolean { return this.byProvider.has(provider); }
  /** The channel that owns a stored input, identified by the bot that received it. */
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

  /**
   * Reply facade. Interpretation holds one of these and never learns which channel an
   * input came from; the input carries that itself.
   */
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
   * Job handlers. Each service only claims rows stamped with its own provider, so running
   * every channel's handler is safe and a job is processed exactly once, by its owner.
   */
  async handleIngestionJob(job: Job): Promise<void> { await Promise.all(this.channels.map(runtime => runtime.ingestion.handleJob(job))); }
  async handleDispatchJob(job: Job): Promise<void> { await Promise.all(this.channels.map(runtime => runtime.dispatch.handle(job))); }
  async handleFollowupJob(job: Job): Promise<void> { await Promise.all(this.channels.map(runtime => runtime.dispatch.followup(job))); }
}
