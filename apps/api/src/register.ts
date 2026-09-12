import type { FastifyInstance } from 'fastify';
import type { Composition } from '@ground/server';
export async function register(app: FastifyInstance, composition: Composition) {
 for (const module of composition.modules) await module.registerRoutes?.(app);
 app.get('/api/health', async () => ({ status: 'ok', modules: composition.modules.map(m => m.name) }));
 app.all('/api/*', async (_request, reply) => reply.code(503).send({ code: 'NOT_READY', message: 'Feature is not registered', retryable: false }));
}
