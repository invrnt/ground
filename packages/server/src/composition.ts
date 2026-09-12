import { notReady, toolNames, type ActorContext, type ToolName, type Job } from '@ground/contracts';
import { createPool, PgTransactions, PgJobQueue, LocalPrivateFiles, Sessions } from './infra';
import { projectModule, PgProjectRepository } from './modules/project';
import { BotTelegramAdapter } from './adapters/telegram';
import { IngestionService, PgIngestionRepository, ingestionModule } from './modules/ingestion';
import type { FastifyInstance } from 'fastify';
export interface ServerModule { name: string; registerRoutes?: (app: FastifyInstance) => Promise<void>; jobs?: Partial<Record<Job['kind'], (job: Job) => Promise<void>>>; }
export interface Composition { runtime?: ReturnType<typeof createRuntime>; modules: readonly ServerModule[]; invoke: (name: ToolName, context: ActorContext, input: unknown) => Promise<unknown>; }
export function createRuntime() {
 const pool=createPool();
 const transactions=new PgTransactions(pool);
 const queue=new PgJobQueue(transactions);
 const files=new LocalPrivateFiles(process.env['PRIVATE_STORAGE_PATH']||'/tmp/ground-private');
 const sessions=new Sessions(pool,process.env['PUBLIC_BASE_URL']||'http://localhost:3000');
 const projects=new PgProjectRepository(transactions);
 return {pool,transactions,queue,files,sessions,projects};
}
export function createComposition(): Composition {
 const runtime=createRuntime();
 const modules:ServerModule[]=[projectModule(runtime.pool,runtime.sessions,runtime.files)];
 const token=process.env['TELEGRAM_BOT_TOKEN'];
 const webhookSecret=process.env['TELEGRAM_WEBHOOK_SECRET'];
 const botId=token?.split(':')[0];
 if(token && webhookSecret && botId && /^\d+$/.test(botId)) {
  const adapter=new BotTelegramAdapter({token,webhook_secret:webhookSecret});
  const repository=new PgIngestionRepository(tx=>runtime.transactions.client(tx));
  const service=new IngestionService({bot_id:botId,adapter,repository,transactions:runtime.transactions,queue:runtime.queue,files:runtime.files});
  modules.push(ingestionModule(service));
 } else {
  modules.push({name:'telegram_configuration_pending',registerRoutes:async app=> { app.post('/webhooks/telegram',async()=>notReady('Telegram configuration')); }});
 }
 return {runtime,modules,invoke:async(name,context)=>name==='get_project_context'?runtime.projects.snapshot(context):notReady(name)};
}
export const unavailableTools = toolNames.filter(name=>name!=='get_project_context');
