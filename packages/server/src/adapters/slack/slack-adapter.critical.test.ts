import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GroundError } from '@ground/contracts';
import { SlackChannelAdapter, SOCKET_MODE_TRUSTED } from './slack-adapter';

const SIGNING_SECRET = 'slack-signing-secret-for-tests';
const BINDING = { project_id: '00000000-0000-4000-8000-000000000001', run_id: '00000000-0000-4000-8000-000000000002' };
const adapter = new SlackChannelAdapter({ token: 'xoxb-test', signing_secret: SIGNING_SECRET });

function messageEvent(event: Record<string, unknown>) {
  return { type: 'event_callback', event_id: 'Ev0PV52K21', team_id: 'T0C1GCKKTK3', event: { type: 'message', channel: 'C0C0Z9V6MBR', ts: '1789084800.000100', user: 'U0C0Z3S5RFZ', ...event } };
}
function sign(body: string, timestamp: string) {
  return 'v0=' + createHmac('sha256', SIGNING_SECRET).update(`v0:${timestamp}:${body}`).digest('hex');
}

describe('Slack channel adapter', () => {
  it('rejects a forged signature and accepts the genuine one', () => {
    const body = JSON.stringify(messageEvent({ text: 'llegó el material' }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(() => adapter.verifyWebhook({ signature: sign(body, timestamp), timestamp, body })).not.toThrow();
    expect(() => adapter.verifyWebhook({ signature: 'v0=' + '0'.repeat(64), timestamp, body })).toThrow(GroundError);
  });

  it('refuses a correctly signed request that is older than the replay window', () => {
    const body = JSON.stringify(messageEvent({ text: 'viejo' }));
    const stale = String(Math.floor(Date.now() / 1000) - 600);
    expect(() => adapter.verifyWebhook({ signature: sign(body, stale), timestamp: stale, body })).toThrow(/stale/i);
  });

  it('trusts a Socket Mode delivery only through the in-process sentinel', () => {
    expect(() => adapter.verifyWebhook(SOCKET_MODE_TRUSTED)).not.toThrow();
    expect(() => adapter.verifyWebhook('slack.socket-mode')).toThrow(GroundError);
  });

  it('normalizes text, typed media and a thread parent', () => {
    const raw = messageEvent({
      subtype: 'file_share', text: 'llegaron seis bultos', thread_ts: '1789084700.000900',
      files: [
        { id: 'F01', name: 'nota.m4a', mimetype: 'audio/mp4', filetype: 'm4a', size: 51200, duration_ms: 12000 },
        { id: 'F02', name: 'foto.jpg', mimetype: 'image/jpeg', filetype: 'jpg', size: 204800 },
      ],
    });
    const message = adapter.normalizeUpdate(raw, BINDING, '2026-09-12T14:00:00.000Z');
    expect(message.provider).toBe('slack');
    expect(message.text).toBe('llegaron seis bultos');
    expect(message.reply_to_message_id).toBe('1789084700.000900');
    expect(message.media.map(m => m.kind)).toEqual(['audio', 'photo']);
    expect(message.media.map(m => m.provider_file_id)).toEqual(['F01', 'F02']);
    expect(message.sender_id).toBe('U0C0Z3S5RFZ');
  });

  it('treats a top-level message as having no parent', () => {
    const raw = messageEvent({ text: 'sin hilo', thread_ts: '1789084800.000100' });
    expect(adapter.normalizeUpdate(raw, BINDING).reply_to_message_id).toBeNull();
  });

  it('reads the edited body of a message_changed event', () => {
    const raw = messageEvent({ subtype: 'message_changed', message: { ts: '1789084800.000100', user: 'U0C0Z3S5RFZ', text: 'corregido: ocho bultos', edited: { user: 'U0C0Z3S5RFZ', ts: '1789084900.000000' } } });
    expect(adapter.normalizeUpdate(raw, BINDING).text).toBe('corregido: ocho bultos');
  });

  it('names the reason for every rejected attachment instead of dropping it', () => {
    const long = messageEvent({ files: [{ id: 'F03', name: 'largo.m4a', mimetype: 'audio/mp4', filetype: 'm4a', size: 1000, duration_ms: 90000 }] });
    expect(adapter.intakeError(long)).toMatch(/60 segundos/);
    const big = messageEvent({ files: [{ id: 'F04', name: 'grande.jpg', mimetype: 'image/jpeg', filetype: 'jpg', size: 11 * 1024 * 1024 }] });
    expect(adapter.intakeError(big)).toMatch(/10 MB/);
    const gone = messageEvent({ files: [{ id: 'F05', name: 'ido.jpg', mimetype: 'image/jpeg', mode: 'tombstone', size: 10 }] });
    expect(adapter.intakeError(gone)).toMatch(/ya no conserva/);
    expect(adapter.intakeError(messageEvent({}))).toMatch(/Envía texto/);
    expect(adapter.intakeError(messageEvent({ text: 'todo bien' }))).toBeNull();
  });

  it('carries the tapped choice and enough context to answer it', () => {
    const raw = { type: 'block_actions', user: { id: 'U0C19RHEES1' }, channel: { id: 'C0C1EKE5A7L' }, response_url: 'https://hooks.slack.com/actions/T1/1/abc', actions: [{ action_id: 'ground_choice', value: 'yes', action_ts: '1789084950.000200' }] };
    const incoming = adapter.inspectUpdate(raw);
    expect(incoming.callback?.data).toBe('yes');
    expect(incoming.sender_id).toBe('U0C19RHEES1');
    expect(incoming.chat_id).toBe('C0C1EKE5A7L');
    const context = JSON.parse(Buffer.from(incoming.callback!.id, 'base64url').toString('utf8'));
    expect(context).toMatchObject({ channel: 'C0C1EKE5A7L', user: 'U0C19RHEES1' });
  });

  it('gives the same update_id for a redelivered event so ingestion can dedupe', () => {
    const raw = messageEvent({ text: 'una vez' });
    expect(adapter.inspectUpdate(raw).update_id).toBe(adapter.inspectUpdate(structuredClone(raw)).update_id);
  });

  it('refuses an update that is not a Slack envelope', () => {
    expect(() => adapter.inspectUpdate({ hello: 'world' })).toThrow(GroundError);
  });
});
