import { notReady, toolNames, type ActorContext, type ToolName, type Job } from '@ground/contracts';
import type { FastifyInstance } from 'fastify';
export interface ServerModule { name: string; registerRoutes?: (app: FastifyInstance) => Promise<void>; jobs?: Partial<Record<Job['kind'], (job: Job) => Promise<void>>>; }
export interface Composition { modules: readonly ServerModule[]; invoke: (name: ToolName, context: ActorContext, input: unknown) => Promise<unknown>; }
export function createComposition(): Composition { return { modules: [], invoke: async (name) => notReady(name) }; }
export const unavailableTools = toolNames;
