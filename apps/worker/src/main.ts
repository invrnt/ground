import { randomUUID } from 'node:crypto';
import { createComposition } from '@ground/server';
import type { Job } from '@ground/contracts';
const composition=createComposition();
const handlers:Partial<Record<Job['kind'],(job:Job)=>Promise<void>>>=Object.assign({},...composition.modules.map(module=>module.jobs??{}));
const owner=randomUUID(); let stopped=false;
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{stopped=true;});
try { while(!stopped) { const worked=await composition.runtime?.queue.tick(owner,handlers); if(!worked)await new Promise(resolve=>setTimeout(resolve,1000)); } } finally { await composition.runtime?.pool.end(); }
