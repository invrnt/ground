import Fastify from 'fastify';
import staticFiles from '@fastify/static';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createComposition } from '@ground/server';
import { register } from './register';
const app = Fastify({ logger: { redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.checkpoint_token'] } });
const composition=createComposition();
await register(app, composition);
app.addHook('onClose',async()=>{await composition.runtime?.pool.end();});
const webRoot = resolve(process.env['WEB_DIST'] ?? '../web/dist');
if (existsSync(webRoot)) {
 await app.register(staticFiles, { root: webRoot });
 app.get('/login',async(_request,reply)=>reply.sendFile('index.html'));
 app.get('/projects/*',async(_request,reply)=>reply.sendFile('index.html'));
}
await app.listen({ port: Number(process.env['PORT'] ?? 3000), host: process.env['HOST'] ?? '127.0.0.1' });
let closing=false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
 if(closing)return;closing=true;
 void app.close().catch(()=>{console.error({status:'api_shutdown_failed'});process.exitCode=1;});
});
