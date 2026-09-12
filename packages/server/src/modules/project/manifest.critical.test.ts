import { describe, expect, it } from 'vitest';
import { manifestSchema } from './manifest';

const BASE = {
  scenario_version: '1', scenario_date: '2026-09-12', timezone: 'America/Bogota', currency: 'COP',
  project_name: 'La Arboleda', demo: true,
  material: { code: 'POR-GRIS-60', brand: null, reference: null, finish: null, source_url: null, coverage: '1.26' },
  test_address: null, desired_delivery_date: '2026-09-20',
  drawing: { reference: 'P-03', revision: 3, wall: 'W2', demo: true },
  reminder_delay_seconds: 60, telegram_chat_id: '-100200', test_recipient_id: '-100300',
  test_recipient_reachable: true, ambiguous_workspace_id: null,
  members: [
    { username: 'luis', name: 'Luis', roles: ['worker'], telegram_sender_id: '1', remote_user_id: null },
    { username: 'ana', name: 'Ana', roles: ['supervisor'], telegram_sender_id: '2', remote_user_id: null },
    { username: 'juan', name: 'Juan', roles: ['admin'], telegram_sender_id: '3', remote_user_id: null },
  ],
  media: [], configuration_status: 'ok',
};

describe('demo manifest', () => {
  it('still accepts a Telegram-only manifest unchanged', () => {
    expect(manifestSchema.safeParse(BASE).success).toBe(true);
  });

  it('accepts a Slack conversation as the test recipient', () => {
    const slack = { ...BASE, test_recipient_id: 'C0C18E4LPTM', test_recipient_provider: 'slack', slack_channel_id: 'C0C0Z9V6MBR' };
    expect(manifestSchema.safeParse(slack).success).toBe(true);
  });

  it('accepts Slack member identities alongside Telegram ones', () => {
    const members = BASE.members.map((m, i) => ({ ...m, slack_user_id: `U000000000${i}` }));
    expect(manifestSchema.safeParse({ ...BASE, members }).success).toBe(true);
  });

  it('rejects duplicate Slack identities the way it rejects duplicate Telegram ones', () => {
    const members = BASE.members.map(m => ({ ...m, slack_user_id: 'U0C0Z3S5RFZ' }));
    const result = manifestSchema.safeParse({ ...BASE, members });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/Duplicate Slack identity/);
  });

  it('refuses a recipient whose shape contradicts its provider', () => {
    const numericSlack = manifestSchema.safeParse({ ...BASE, test_recipient_provider: 'slack' });
    expect(numericSlack.success).toBe(false);
    expect(JSON.stringify(numericSlack.error?.issues)).toMatch(/Slack test recipient/);
    const textTelegram = manifestSchema.safeParse({ ...BASE, test_recipient_id: 'C0C18E4LPTM', test_recipient_provider: 'telegram' });
    expect(textTelegram.success).toBe(false);
    expect(JSON.stringify(textTelegram.error?.issues)).toMatch(/Telegram test recipient/);
  });
});
