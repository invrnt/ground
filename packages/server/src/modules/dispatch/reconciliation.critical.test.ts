import { describe, expect, it } from 'vitest';
import { isProviderMessageId } from './dispatch-service';

describe('reconciliation message ids', () => {
  it('accepts a Telegram integer id and rejects a Slack timestamp for Telegram', () => {
    expect(isProviderMessageId('telegram', '4821')).toBe(true);
    expect(isProviderMessageId('telegram', '1789084800.000100')).toBe(false);
  });

  it('accepts a Slack timestamp and rejects a bare integer for Slack', () => {
    expect(isProviderMessageId('slack', '1789084800.000100')).toBe(true);
    expect(isProviderMessageId('slack', '4821')).toBe(false);
  });

  it('rejects a missing id for either provider', () => {
    for (const provider of ['telegram', 'slack'] as const) {
      expect(isProviderMessageId(provider, null)).toBe(false);
      expect(isProviderMessageId(provider, '')).toBe(false);
      expect(isProviderMessageId(provider, undefined)).toBe(false);
    }
  });

  it('rejects ids that are not message ids at all', () => {
    expect(isProviderMessageId('slack', '1789084800.')).toBe(false);
    expect(isProviderMessageId('slack', '.000100')).toBe(false);
    expect(isProviderMessageId('slack', '1789084800.000100.5')).toBe(false);
    expect(isProviderMessageId('telegram', '48 21')).toBe(false);
    expect(isProviderMessageId('telegram', 'C0C18E4LPTM')).toBe(false);
  });

  /** The point of the fix: validation follows the request, not the running service. */
  it('is decided by the provider argument alone', () => {
    const slackId = '1789084800.000100';
    expect(isProviderMessageId('slack', slackId)).toBe(true);
    expect(isProviderMessageId('telegram', slackId)).toBe(false);
  });
});
