import { GroundError,idSchema,operationProposalSchema } from '@ground/contracts';
import type { ServerModule } from '../../composition';
import type { Sessions } from '../../infra/sessions';
import type { PurchaseService } from './purchase-service';
export * from './purchase-service';
export function purchaseModule(service:PurchaseService,sessions:Sessions):ServerModule{return {name:'purchases',registerRoutes:async app=>{
 app.get<{Params:{p:string}}>('/api/projects/:p/purchases',async request=>service.list(await sessions.context(request,idSchema.parse(request.params.p))));
 app.post<{Params:{p:string}}>('/api/projects/:p/purchases',async request=>{
  await sessions.mutation(request);const context=await sessions.context(request,idSchema.parse(request.params.p));const proposal=operationProposalSchema.parse(request.body);if(proposal.type!=='register_purchase')throw new GroundError('VALIDATION_ERROR','Expected invoice purchase');const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new GroundError('VALIDATION_ERROR','Idempotency-Key required');return service.execute({context,proposal,source_message_id:proposal.evidence_ids[0]??key,idempotency_key:key});
 });
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/purchases/:id/receipts',async request=>{
  await sessions.mutation(request);const context=await sessions.context(request,idSchema.parse(request.params.p));const proposal=operationProposalSchema.parse(request.body);if(proposal.type!=='confirm_receipt')throw new GroundError('VALIDATION_ERROR','Expected explicit receipt confirmation');const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new GroundError('VALIDATION_ERROR','Idempotency-Key required');return service.execute({context,proposal:{...proposal,entity_ids:{purchase_id:idSchema.parse(request.params.id)}},source_message_id:key,idempotency_key:key});
 });
}};}
