import type { FastifyInstance } from 'fastify';
import { GroundError, notReady } from '@ground/contracts';
import type { ServerModule } from '../composition';
import type { ChannelRouter, ChannelRuntime } from './router';
import { SOCKET_MODE_TRUSTED } from '../adapters/slack';

/** Telegram authenticates a webhook with a shared header token. */
function registerTelegram(app: FastifyInstance, runtime: ChannelRuntime): void {
  app.post(runtime.webhook_path, { bodyLimit: 1024 * 1024 }, async request => {
    const secret = request.headers['x-telegram-bot-api-secret-token'];
    runtime.adapter.verifyWebhook(secret);
    try {
      return await runtime.dispatch.webhook(secret, request.body, async () => {
        const input = await runtime.ingestion.accept(secret, request.body);
        return { accepted: true, input_id: input.id };
      });
    } catch (error) {
      // Telegram retries non-2xx responses. A permanently rejected, authenticated
      // update must not block later reports; transient/storage failures still retry.
      if (error instanceof GroundError && !error.retryable && ['FORBIDDEN', 'CONFLICT', 'VALIDATION_ERROR'].includes(error.code)) {
        request.log.warn({ event: 'telegram_update_rejected', code: error.code });
        return { accepted: false, reason: error.code };
      }
      throw error;
    }
  });
}

/**
 * Slack signs the exact bytes it sent, so this route keeps the raw body. It is registered
 * inside its own plugin scope so that parser never applies to the rest of the API.
 */
async function registerSlack(app: FastifyInstance, runtime: ChannelRuntime): Promise<void> {
  await app.register(async scoped => {
    scoped.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, payload, done) => {
      try { done(null, { raw: payload as string, parsed: JSON.parse(payload as string) as unknown }); } catch { done(new Error('Invalid JSON'), undefined); }
    });
    scoped.post(runtime.webhook_path, { bodyLimit: 1024 * 1024 }, async (request, reply) => {
      const body = request.body as { raw: string; parsed: unknown };
      const envelope = body.parsed as { type?: string; challenge?: string };
      /** Slack verifies a new Request URL by asking the endpoint to echo a challenge. */
      if (envelope?.type === 'url_verification' && typeof envelope.challenge === 'string') return reply.send({ challenge: envelope.challenge });
      const secret = { signature: String(request.headers['x-slack-signature'] ?? ''), timestamp: String(request.headers['x-slack-request-timestamp'] ?? ''), body: body.raw };
      return runtime.dispatch.webhook(secret, body.parsed, async () => {
        const input = await runtime.ingestion.accept(secret, body.parsed);
        return { accepted: true, input_id: input.id };
      });
    });
  });
}

/**
 * One module for every channel. Registering a single set of job handlers keeps the worker
 * from binding a job kind twice; the router decides which channel actually runs each job.
 */
export function channelsModule(router: ChannelRouter): ServerModule {
  return {
    name: `channels(${router.providers.join(',') || 'none'})`,
    registerRoutes: async app => {
      for (const runtime of router.channels) {
        if (runtime.provider === 'slack') await registerSlack(app, runtime);
        else registerTelegram(app, runtime);
      }
      /** A provider nobody configured still answers, so callers get a reason not a 404. */
      for (const [provider, path] of [['telegram', '/webhooks/telegram'], ['slack', '/webhooks/slack']] as const) {
        if (!router.has(provider)) app.post(path, async () => notReady(`${provider} configuration`));
      }
    },
    jobs: {
      send_channel_reply: job => router.handleIngestionJob(job),
      dispatch_request: job => router.handleDispatchJob(job),
      follow_up: job => router.handleFollowupJob(job),
    },
  };
}

export { SOCKET_MODE_TRUSTED };
