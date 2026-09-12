import { randomUUID } from 'node:crypto';
import { createComposition } from '@ground/server';
import type { Job } from '@ground/contracts';
const composition=createComposition();
const handlers:Partial<Record<Job['kind'],(job:Job)=>Promise<void>>>=Object.assign({},...composition.modules.map(module=>module.jobs??{}));
const owner=randomUUID(); let stopped=false;
const stop=()=>{stopped=true;};
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,stop);
try { while(!stopped) {
 let worked=false;
 try { worked=await composition.runtime?.queue.tick(owner,handlers)??false; for(const module of composition.modules){if(stopped)break;await module.poll?.();} }
 catch { console.error({status:'worker_tick_failed',retrying:true}); }
 if(!worked&&!stopped)await new Promise(resolve=>setTimeout(resolve,1000));
} } finally {
 await composition.runtime?.pool.end();
 for(const signal of ['SIGINT','SIGTERM'] as const)process.off(signal,stop);
}
