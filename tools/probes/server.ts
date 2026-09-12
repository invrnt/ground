// Isolated, loopback-only SDK feasibility server. Never register this in production.
import Fastify from 'fastify';
import { EventType, RunAgentInputSchema, type BaseEvent } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { z } from 'zod';
const schema=z.object({id:z.literal('foundation-demo'),tool_call_id:z.literal('foundation-confirm'),status:z.enum(['pending','confirmed'])}).strict();
const path = new URL('../../.storage/probe-checkpoint.json', import.meta.url);
await mkdir(new URL('../../.storage/',import.meta.url),{recursive:true,mode:0o700});
async function load() { try { return schema.parse(JSON.parse(await readFile(path,'utf8'))); } catch(error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; return schema.parse({id:'foundation-demo',tool_call_id:'foundation-confirm',status:'pending'}); } }
async function save(value:z.infer<typeof schema>) { const temporary=new URL(path.href+'.tmp'); await writeFile(temporary,JSON.stringify(value),{mode:0o600});await rename(temporary,path); }
const app=Fastify();
app.addHook('onSend',async (_request,reply,payload)=>{reply.header('Access-Control-Allow-Origin','http://localhost:5174'); return payload;});
app.options('/agent',async (_request,reply)=>reply.header('Access-Control-Allow-Headers','content-type').header('Access-Control-Allow-Methods','POST').send());
app.get('/checkpoint',async ()=>load());
app.post('/agent',async (request,reply)=>{
 const input=RunAgentInputSchema.parse(request.body);
 const checkpoint=await load();
 const response=input.messages.find(message=>message.role==='tool' && message.toolCallId===checkpoint.tool_call_id);
 if(response?.role==='tool') { const result=z.object({confirmed:z.literal(true)}).strict().parse(JSON.parse(response.content)); if(result.confirmed) checkpoint.status='confirmed'; }
 await save(checkpoint);
 const events:BaseEvent[]=[{type:EventType.RUN_STARTED,threadId:input.threadId,runId:input.runId},{type:EventType.STATE_SNAPSHOT,snapshot:checkpoint}];
 if(checkpoint.status==='pending') events.push({type:EventType.TOOL_CALL_START,toolCallId:checkpoint.tool_call_id,toolCallName:'confirm_probe',parentMessageId:'foundation-message'},{type:EventType.TOOL_CALL_ARGS,toolCallId:checkpoint.tool_call_id,delta:JSON.stringify({checkpoint_id:checkpoint.id})},{type:EventType.TOOL_CALL_END,toolCallId:checkpoint.tool_call_id});
 events.push({type:EventType.RUN_FINISHED,threadId:input.threadId,runId:input.runId});
 const encoder=new EventEncoder();reply.header('Content-Type','text/event-stream');return events.map(event=>encoder.encode(event)).join('');
});
await app.listen({port:4311,host:'127.0.0.1'});
console.info('Foundation probe http://127.0.0.1:4311; private file checkpoint. PostgreSQL migration is a separate check.');
