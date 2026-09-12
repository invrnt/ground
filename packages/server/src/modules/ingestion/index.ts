import type { ServerModule } from '../../composition';
import type { IngestionService } from './ingestion-service';
export * from './ingestion-service';
export * from './pg-ingestion-repository';
export * from './types';
export function ingestionModule(service: IngestionService): ServerModule {
  return { name: 'ingestion', registerRoutes: async app => {
    app.post('/webhooks/telegram', { bodyLimit: 1024 * 1024 }, async request => {
      const input = await service.accept(request.headers['x-telegram-bot-api-secret-token'], request.body);
      return { accepted: true, input_id: input.id };
    });
  }, jobs: { send_channel_reply: job => service.handleJob(job) } };
}
