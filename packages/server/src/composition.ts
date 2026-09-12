import { notReady, toolNames, type ActorContext, type ToolName, type Job } from '@ground/contracts';
import { createPool, PgTransactions, PgJobQueue, LocalPrivateFiles, Sessions } from './infra';
import { projectModule, PgProjectRepository } from './modules/project';
import type { FastifyInstance } from 'fastify';
export interface ServerModule { name: string; registerRoutes?: (app: FastifyInstance) => Promise<void>; jobs?: Partial<Record<Job['kind'], (job: Job) => Promise<void>>>; }
export interface Composition { runtime?: ReturnType<typeof createRuntime>; modules: readonly ServerModule[]; invoke: (name: ToolName, context: ActorContext, input: unknown) => Promise<unknown>; }
export function createRuntime() { const pool=createPool(); const transactions=new PgTransactions(pool); const queue=new PgJobQueue(transactions); const files=new LocalPrivateFiles(process.env['PRIVATE_STORAGE_PATH']??'/tmp/ground-private'); const sessions=new Sessions(pool,process.env['PUBLIC_BASE_URL']??'http://localhost:3000'); const projects=new PgProjectRepository(transactions); return {pool,transactions,queue,files,sessions,projects}; }
export function createComposition(): Composition { const runtime=createRuntime(); return {runtime, modules: [projectModule(runtime.pool,runtime.sessions,runtime.files)], invoke: async (name) => notReady(name) }; }
export const unavailableTools = toolNames;
