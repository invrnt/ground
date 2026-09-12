import type { ChannelAdapter } from '@ground/contracts';
import { BotTelegramAdapter } from '../adapters/telegram';
import { SlackChannelAdapter } from '../adapters/slack';

export type ChannelProvider = 'telegram' | 'slack';
export const CHANNEL_PROVIDERS: readonly ChannelProvider[] = ['telegram', 'slack'];

/** One conversational channel Ground can be reached on, built from the environment. */
export interface ChannelDefinition {
  readonly provider: ChannelProvider;
  /** Identifies this channel's rows. Telegram uses the bot number, Slack the bot user id. */
  readonly bot_id: string;
  readonly adapter: ChannelAdapter;
  readonly webhook_path: string;
}

/** Why a configured-looking channel was not started, so operations can show it. */
export interface ChannelProblem { readonly provider: ChannelProvider; readonly reason: string }
export interface ChannelLoad { readonly channels: readonly ChannelDefinition[]; readonly problems: readonly ChannelProblem[] }

type Env = Record<string, string | undefined>;
const trimmed = (env: Env, name: string): string | undefined => { const value = env[name]?.trim(); return value ? value : undefined; };

/**
 * GROUND_CHANNELS is the allow list: a comma separated subset of the providers, or "none"
 * to run with no channel at all. Without it every provider that is fully configured starts,
 * so enabling Slack never silently disables Telegram. A provider is also switched off on its
 * own with GROUND_CHANNEL_<PROVIDER>=off.
 */
function requested(env: Env): Set<ChannelProvider> | null {
  const raw = trimmed(env, 'GROUND_CHANNELS');
  if (!raw) return null;
  if (raw.toLowerCase() === 'none') return new Set();
  const names = raw.split(',').map(part => part.trim().toLowerCase()).filter(Boolean);
  return new Set(names.filter((name): name is ChannelProvider => (CHANNEL_PROVIDERS as readonly string[]).includes(name)));
}

function disabled(env: Env, provider: ChannelProvider): boolean {
  const value = trimmed(env, `GROUND_CHANNEL_${provider.toUpperCase()}`)?.toLowerCase();
  return value === 'off' || value === 'false' || value === '0';
}

function telegram(env: Env): ChannelDefinition | ChannelProblem {
  const token = trimmed(env, 'TELEGRAM_BOT_TOKEN'), secret = trimmed(env, 'TELEGRAM_WEBHOOK_SECRET');
  if (!token || !secret) return { provider: 'telegram', reason: 'TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET are required' };
  const bot_id = token.split(':')[0];
  if (!bot_id || !/^\d+$/.test(bot_id)) return { provider: 'telegram', reason: 'TELEGRAM_BOT_TOKEN does not start with the numeric bot id' };
  return { provider: 'telegram', bot_id, adapter: new BotTelegramAdapter({ token, webhook_secret: secret }), webhook_path: '/webhooks/telegram' };
}

function slack(env: Env): ChannelDefinition | ChannelProblem {
  const token = trimmed(env, 'SLACK_BOT_TOKEN'), secret = trimmed(env, 'SLACK_SIGNING_SECRET'), bot_id = trimmed(env, 'SLACK_BOT_USER_ID');
  if (!token || !secret || !bot_id) return { provider: 'slack', reason: 'SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET and SLACK_BOT_USER_ID are required' };
  if (!/^U[A-Z0-9]+$/.test(bot_id)) return { provider: 'slack', reason: 'SLACK_BOT_USER_ID must be the bot user id, for example U0123456789' };
  return { provider: 'slack', bot_id, adapter: new SlackChannelAdapter({ token, signing_secret: secret }), webhook_path: '/webhooks/slack' };
}

const builders: Record<ChannelProvider, (env: Env) => ChannelDefinition | ChannelProblem> = { telegram, slack };

/** Builds every channel the environment asks for. Providers are independent of each other. */
export function loadChannels(env: Env = process.env): ChannelLoad {
  const allowed = requested(env);
  const channels: ChannelDefinition[] = [];
  const problems: ChannelProblem[] = [];
  for (const provider of CHANNEL_PROVIDERS) {
    if (allowed && !allowed.has(provider)) continue;
    if (disabled(env, provider)) continue;
    const built = builders[provider](env);
    if ('adapter' in built) channels.push(built);
    /** Silence is right for a provider nobody configured; an explicit request is reported. */
    else if (allowed?.has(provider)) problems.push(built);
  }
  return { channels, problems };
}
