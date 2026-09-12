import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { GroundError,idSchema,loginInputSchema } from '@ground/contracts';
import { Sessions } from '../../infra/sessions';
import { LocalPrivateFiles } from '../../infra/files';
export function projectModule(pool:pg.Pool,sessions:Sessions,files:LocalPrivateFiles) { return {name:'project',registerRoutes:async(app:FastifyInstance)=> {
 app.setErrorHandler((error,_request,reply)=> { const codes={UNAUTHORIZED:401,FORBIDDEN:403,NOT_FOUND:404,VALIDATION_ERROR:400,CONFLICT:409,EXPIRED:410,NOT_READY:503,PROVIDER_UNAVAILABLE:503,UNCERTAIN:409,INTERNAL_ERROR:500}; if(error instanceof GroundError)return reply.code(codes[error.code]).send({code:error.code,message:error.message,retryable:error.retryable}); if(error instanceof Error && error.name==='ZodError')return reply.code(400).send({code:'VALIDATION_ERROR',message:'Invalid request',retryable:false}); return reply.code(500).send({code:'INTERNAL_ERROR',message:'Request failed',retryable:false}); });
 app.get('/health/live',async()=>({status:'ok'}));
 app.get('/health/ready',async(_request,reply)=> { try { const result=await pool.query("SELECT EXISTS(SELECT 1 FROM worker_heartbeats WHERE seen_at>now()-interval '30 seconds') AS worker"); const ready=result.rows[0]?.worker===true; return reply.code(ready?200:503).send({status:ready?'ready':'worker_pending'}); }catch { return reply.code(503).send({status:'database_unavailable'}); } });
 app.post('/api/session',async(request,reply)=> { sessions.checkOrigin(request); const body=loginInputSchema.parse(request.body); const result=await sessions.login(body.username,body.password,request.ip); reply.header('Cache-Control','no-store').header('Set-Cookie',sessions.cookie(result.token)); return result.session; });
 app.get('/api/session',async(request,reply)=> { reply.header('Cache-Control','no-store'); return sessions.get(sessions.token(request)); });
 app.delete('/api/session',async(request,reply)=> { await sessions.mutation(request); await sessions.logout(sessions.token(request)); return reply.header('Set-Cookie',sessions.cookie('',0)).code(204).send(); });
 app.get<{Params:{p:string;id:string}}>('/api/projects/:p/files/:id',async(request,reply)=> { const context=await sessions.context(request,idSchema.parse(request.params.p)); const fileId=idSchema.parse(request.params.id); const result=await pool.query<{content_type:string;restricted:boolean}>('SELECT content_type,restricted FROM private_files WHERE id=$1 AND project_id=$2 AND run_id=$3',[fileId,context.project_id,context.run_id]); const file=result.rows[0]; if(!file)throw new GroundError('NOT_FOUND','File not found'); if(file.restricted&&!context.permissions.includes('costs'))throw new GroundError('FORBIDDEN','File access denied'); return reply.header('Cache-Control','private, no-store').header('X-Content-Type-Options','nosniff').header('Content-Disposition',`attachment; filename="${fileId}"`).type(file.content_type).send(Buffer.from(await files.read(fileId))); });
 }}; }
export * from './seed';
export * from './manifest';
