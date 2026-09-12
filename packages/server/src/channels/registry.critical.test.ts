import { describe, expect, it } from 'vitest';
import { loadChannels } from './registry';
import { ChannelRouter, type ChannelRuntime } from './router';
import type { ChannelDefinition } from './registry';

const TELEGRAM = { TELEGRAM_BOT_TOKEN: '8012345678:AAExampleTokenValue', TELEGRAM_WEBHOOK_SECRET: 'telegram-hook-secret' };
const SLACK = { SLACK_BOT_TOKEN: 'xoxb-test-token', SLACK_SIGNING_SECRET: 'slack-signing-secret-value', SLACK_BOT_USER_ID: 'U0C1GH9N49F' };

describe('channel registry', () => {
  it('runs both channels at once when both are configured', () => {
    const { channels } = loadChannels({ ...TELEGRAM, ...SLACK });
    expect(channels.map(c => c.provider)).toEqual(['telegram', 'slack']);
    expect(new Set(channels.map(c => c.bot_id)).size).toBe(2);
  });

  it('does not disable Telegram just because Slack is configured', () => {
    const { channels } = loadChannels({ ...TELEGRAM, ...SLACK });
    expect(channels.some(c => c.provider === 'telegram')).toBe(true);
  });

  it('honours an explicit allow list', () => {
    expect(loadChannels({ ...TELEGRAM, ...SLACK, GROUND_CHANNELS: 'slack' }).channels.map(c => c.provider)).toEqual(['slack']);
    expect(loadChannels({ ...TELEGRAM, ...SLACK, GROUND_CHANNELS: 'telegram,slack' }).channels).toHaveLength(2);
  });

  it('supports turning every channel off, and one channel off', () => {
    expect(loadChannels({ ...TELEGRAM, ...SLACK, GROUND_CHANNELS: 'none' }).channels).toHaveLength(0);
    expect(loadChannels({ ...TELEGRAM, ...SLACK, GROUND_CHANNEL_SLACK: 'off' }).channels.map(c => c.provider)).toEqual(['telegram']);
  });

  it('starts nothing when nothing is configured, and reports a requested channel that is not', () => {
    expect(loadChannels({}).channels).toHaveLength(0);
    expect(loadChannels({}).problems).toHaveLength(0);
    const asked = loadChannels({ GROUND_CHANNELS: 'slack' });
    expect(asked.channels).toHaveLength(0);
    expect(asked.problems[0]?.reason).toMatch(/SLACK_BOT_TOKEN/);
  });

  it('rejects a Slack bot id that is not a user id', () => {
    const { problems } = loadChannels({ ...SLACK, SLACK_BOT_USER_ID: 'B123', GROUND_CHANNELS: 'slack' });
    expect(problems[0]?.reason).toMatch(/bot user id/);
  });
});

function runtime(provider: 'telegram' | 'slack', bot_id: string, log: string[]): ChannelRuntime {
  const definition = { provider, bot_id, adapter: {} as ChannelDefinition['adapter'], webhook_path: `/webhooks/${provider}` };
  return {
    ...definition,
    ingestion: { handleJob: async () => { log.push(`ingestion:${provider}`); }, enqueueReply: async () => `reply:${provider}` } as unknown as ChannelRuntime['ingestion'],
    dispatch: { handle: async () => { log.push(`dispatch:${provider}`); }, followup: async () => { log.push(`followup:${provider}`); } } as unknown as ChannelRuntime['dispatch'],
  };
}

describe('channel router', () => {
  it('sends a reply back through the channel the input arrived on', async () => {
    const log: string[] = [];
    const router = new ChannelRouter([runtime('telegram', '801', log), runtime('slack', 'U0C1GH9N49F', log)]);
    const input = { bot_id: 'U0C1GH9N49F', provider: 'slack' } as never;
    expect(router.forInput(input).provider).toBe('slack');
    await expect(router.enqueueReply(input, 'hola', {} as never)).resolves.toBe('reply:slack');
  });

  it('refuses to guess when no channel owns the bot that received the input', () => {
    const router = new ChannelRouter([runtime('telegram', '801', [])]);
    expect(() => router.forInput({ bot_id: 'U-unknown', provider: 'slack' } as never)).toThrow(/No channel is configured for bot/);
  });

  it('refuses to register the same provider twice', () => {
    const log: string[] = [];
    expect(() => new ChannelRouter([runtime('slack', 'U1', log), runtime('slack', 'U2', log)])).toThrow(/registered twice/);
  });

  it('offers a job to every channel, so the owner claims it and the others ignore it', async () => {
    const log: string[] = [];
    const router = new ChannelRouter([runtime('telegram', '801', log), runtime('slack', 'U0C1GH9N49F', log)]);
    await router.handleDispatchJob({} as never);
    expect(log).toEqual(['dispatch:telegram', 'dispatch:slack']);
  });

  it('reports exactly the providers it was built with', () => {
    const router = new ChannelRouter([runtime('slack', 'U1', [])]);
    expect(router.providers).toEqual(['slack']);
    expect(router.has('slack')).toBe(true);
    expect(router.has('telegram')).toBe(false);
    expect(() => router.forProvider('telegram')).toThrow(/not configured/);
  });
});
