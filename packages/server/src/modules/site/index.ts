import { randomUUID } from 'node:crypto';
import { GroundError,idSchema,operationProposalSchema } from '@ground/contracts';
import type { ServerModule } from '../../composition';
import type { Sessions } from '../../infra/sessions';
import type { SiteService } from './site-service';
export * from './site-service';
export * from './types';
export function siteModule(service:SiteService,sessions:Sessions):ServerModule {return {name:'site',registerRoutes:async app=>{
 app.post<{Params:{p:string}}>('/api/projects/:p/operations',async(request)=>{await sessions.mutation(request);const context=await sessions.context(request,idSchema.parse(request.params.p));const proposal=operationProposalSchema.parse(request.body);const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new GroundError('VALIDATION_ERROR','Idempotency-Key required');return service.execute({context,proposal,source_message_id:proposal.evidence_ids[0]??randomUUID(),idempotency_key:key});});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/operations/:id/corrections',async(request)=>{await sessions.mutation(request);const context=await sessions.context(request,idSchema.parse(request.params.p));const proposal=operationProposalSchema.parse(request.body);if(proposal.type!=='correct_operation')throw new GroundError('VALIDATION_ERROR','Expected correction');const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new GroundError('VALIDATION_ERROR','Idempotency-Key required');return service.execute({context,proposal:{...proposal,entity_ids:{original_operation_id:idSchema.parse(request.params.id)}},source_message_id:proposal.evidence_ids[0]??randomUUID(),idempotency_key:key});});
 }};}
