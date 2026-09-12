import { z } from 'zod';
import { idSchema,clarificationAnswerInputSchema } from '@ground/contracts';
import type { ServerModule } from '../../composition';
import type { Sessions } from '../../infra/sessions';
import type { InterpretationWorkflow } from './workflow';
export * from './workflow';
export * from './repository';
export * from './resolve-extraction';
export function interpretationModule(service:InterpretationWorkflow,sessions:Sessions):ServerModule{return {name:'interpretation',jobs:{process_input:job=>service.process(job)},registerRoutes:async app=>{
 app.post('/api/projects/:p/clarifications/:id/answer',async request=>{
   await sessions.mutation(request);const params=z.object({p:idSchema,id:idSchema}).parse(request.params);const body=clarificationAnswerInputSchema.parse(request.body);return service.answer(await sessions.context(request,params.p),params.id,body.token,body.answer,body.expected_version);
 });
}};}
