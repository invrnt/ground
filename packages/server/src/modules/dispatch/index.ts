import {idSchema,reconcileRequestInputSchema,linkReplyInputSchema} from '@ground/contracts';
import type {ServerModule} from '../../composition';
import type {Sessions} from '../../infra/sessions';
import type {DispatchService} from './dispatch-service';
export * from './dispatch-service';
export function dispatchModule(service:DispatchService,sessions:Sessions):ServerModule{return {name:'dispatch',jobs:{dispatch_request:job=>service.handle(job),follow_up:job=>service.followup(job)},registerRoutes:async app=>{
 app.get<{Params:{p:string}}>('/api/projects/:p/requests',async request=>{const session=await sessions.get(sessions.token(request));return service.list(await service.requestContext(session.user.id,idSchema.parse(request.params.p)));});
 app.get<{Params:{p:string;id:string}}>('/api/projects/:p/requests/:id',async request=>{const session=await sessions.get(sessions.token(request));const id=idSchema.parse(request.params.id);return service.get(await service.requestContext(session.user.id,idSchema.parse(request.params.p),id),id);});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/requests/:id/reconcile',async request=>{await sessions.mutation(request);const session=await sessions.get(sessions.token(request));const id=idSchema.parse(request.params.id);return service.reconcile(await service.requestContext(session.user.id,idSchema.parse(request.params.p),id),id,reconcileRequestInputSchema.parse(request.body),String(request.headers['idempotency-key']));});
 app.post<{Params:{p:string;id:string;reply:string}}>('/api/projects/:p/requests/:id/replies/:reply/link',async(request,reply)=>{await sessions.mutation(request);const session=await sessions.get(sessions.token(request));const id=idSchema.parse(request.params.id);linkReplyInputSchema.parse(request.body);await service.linkReply(await service.requestContext(session.user.id,idSchema.parse(request.params.p),id),id,idSchema.parse(request.params.reply));return reply.code(204).send();});
}};}
