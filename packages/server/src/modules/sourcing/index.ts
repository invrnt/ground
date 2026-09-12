import { z } from 'zod';
import { GroundError,idSchema } from '@ground/contracts';
import type { ServerModule } from '../../composition';
import type { Sessions } from '../../infra/sessions';
import type { SourcingService } from './service';
export * from './service';
export * from './calculations';
export function sourcingModule(service:SourcingService,sessions:Sessions):ServerModule{return {name:'sourcing',jobs:{research_need:job=>service.process(job)},registerRoutes:async app=>{
 app.get<{Params:{p:string;id:string}}>('/api/projects/:p/needs/:id',async(request,reply)=>{const context=await sessions.context(request,idSchema.parse(request.params.p));reply.header('Cache-Control','private, no-store');return service.comparison(context,idSchema.parse(request.params.id));});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/needs/:id/research',async(request,reply)=>{await sessions.mutation(request);const context=await sessions.context(request,idSchema.parse(request.params.p));const body=z.object({expected_version:z.number().int().nonnegative()}).strict().parse(request.body);const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new GroundError('VALIDATION_ERROR','Idempotency-Key required');return reply.code(202).send(await service.enqueue(context,idSchema.parse(request.params.id),body.expected_version,key));});
 }};}
