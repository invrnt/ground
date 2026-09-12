import { idSchema,retryJobInputSchema,operationsObservationSchema } from '@ground/contracts';
import type { ServerModule } from '../../composition';
import type { Sessions } from '../../infra/sessions';
import type { OperationsService } from './service';
export * from './service';
export function operationsModule(service:OperationsService,sessions:Sessions):ServerModule{return {name:'operations',registerRoutes:async app=>{
 const context=async(request:Parameters<Sessions['token']>[0],project:string,run?:string)=>{const session=await sessions.get(sessions.token(request));return service.context(session.user.id,idSchema.parse(project),run===undefined?undefined:idSchema.parse(run));};
 app.get<{Params:{p:string}}>('/api/projects/:p/operations/status',async(request,reply)=>{reply.header('Cache-Control','private, no-store');return service.status(await context(request,request.params.p));});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/jobs/:id/retry',async request=>{await sessions.mutation(request);const body=retryJobInputSchema.parse(request.body);return service.retry(await context(request,request.params.p),idSchema.parse(request.params.id),body.reason);});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/runs/:id/reset',async(request,reply)=>{await sessions.mutation(request);reply.header('Cache-Control','private, no-store');return service.reset(await context(request,request.params.p,request.params.id),request.body);});
 app.post<{Params:{p:string;id:string}}>('/api/projects/:p/runs/:id/observations',async request=>{await sessions.mutation(request);return service.observe(await context(request,request.params.p,request.params.id),operationsObservationSchema.parse(request.body));});
 app.get<{Params:{p:string;id:string}}>('/api/projects/:p/runs/:id/export',async(request,reply)=>{reply.header('Cache-Control','private, no-store').header('Content-Disposition',`attachment; filename="ground-run-${idSchema.parse(request.params.id)}.json"`);return service.export(await context(request,request.params.p,request.params.id));});
 }};}
