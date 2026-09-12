// Focused local checks. Docker is replaced only for lifecycle command verification.
import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import Fastify from 'fastify';
import pg from 'pg';
import { actorContextSchema, liveStateSchema, projectSnapshotSchema } from '../packages/contracts/src/index';
import { liveModule, LiveService } from '../packages/server/src/modules/live/index';
import { PgTransactions } from '../packages/server/src/infra/database';
import { Sessions } from '../packages/server/src/infra/sessions';

const root = resolve(import.meta.dirname, '..');
function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), 'ground-lifecycle-'));
  mkdirSync(resolve(directory, 'scripts')); mkdirSync(resolve(directory, 'bin'));
  copyFileSync(resolve(root, 'scripts/lifecycle.ts'), resolve(directory, 'scripts/lifecycle.ts'));
  copyFileSync(resolve(root, '.env.example'), resolve(directory, '.env.example'));
  const log = resolve(directory, 'docker-calls.jsonl');
  writeFileSync(resolve(directory, 'bin/docker'), `#!/usr/bin/env node\nconst fs=require('node:fs');const a=process.argv.slice(2);fs.appendFileSync(process.env.CHECK_LOG,JSON.stringify(a)+'\\n');if(process.env.CHECK_FAIL&&a.includes(process.env.CHECK_FAIL))process.exit(1);`, { mode: 0o700 });
  const run = (action: string, fail = '') => spawnSync(process.execPath, [resolve(directory, 'scripts/lifecycle.ts'), action], { encoding: 'utf8', env: { ...process.env, PATH: `${resolve(directory, 'bin')}:${process.env.PATH}`, CHECK_LOG: log, CHECK_FAIL: fail } });
  const calls = () => readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line));
  return { directory, run, calls, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}

test('setup preserves existing secrets/data and restart drains both services before recreation', () => {
  const f = fixture();
  try {
    const first = f.run('setup'); assert.equal(first.status, 0, first.stderr);
    const env = readFileSync(resolve(f.directory, '.env'), 'utf8');
    assert.equal(statSync(resolve(f.directory, '.env')).mode & 0o777, 0o600);
    assert.ok(parseEnv(env)['SESSION_SECRET']);
    assert.ok(!first.stdout.includes(parseEnv(env)['SESSION_SECRET'] ?? 'missing'));
    assert.equal(f.run('setup').status, 0);
    assert.equal(readFileSync(resolve(f.directory, '.env'), 'utf8'), env);
    assert.equal(f.run('restart').status, 0);
    const calls = f.calls();
    const recreate = calls.findIndex(args => args.includes('--force-recreate'));
    assert.ok(recreate > 0);
    assert.deepEqual(calls[recreate - 2].slice(-5), ['stop', '--timeout', '300', 'api', 'worker']);
    assert.ok(calls[recreate].includes('--no-deps'));
    assert.ok(calls.some(args => args.includes('db:migrate')));
    assert.ok(calls.some(args => args.includes('demo:configure')));
    assert.ok(calls.some(args => args.includes('demo:seed')));
    assert.ok(!calls.some(args => args.includes('demo:reset') || args.includes('down') || args.includes('--volumes')));
    assert.equal(f.run('stop').status, 0);
    assert.deepEqual(f.calls().at(-1)?.slice(-2), ['stop', 'db']);
    assert.equal(readFileSync(resolve(f.directory, '.env'), 'utf8'), env);
  } finally { f.cleanup(); }
});

test('failed setup stops before seed and missing Docker produces actionable safe output', () => {
  const f = fixture();
  try {
    const unavailable = f.run('setup', 'info'); assert.notEqual(unavailable.status, 0);
    assert.match(unavailable.stderr, /cannot access/); assert.ok(!existsSync(resolve(f.directory, '.env')));
    const failure = f.run('setup', 'demo:configure'); assert.notEqual(failure.status, 0);
    assert.ok(!f.calls().some(args => args.includes('demo:seed')));
  } finally { f.cleanup(); }
});

test('real worker SIGTERM waits for active tick settlement and skips new polls', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ground-shutdown-'));
  const log = resolve(directory, 'events');
  const hook = resolve(directory, 'hook.mjs');
  const source = `import {appendFileSync} from 'node:fs';const log=${JSON.stringify(log)};const write=v=>appendFileSync(log,v+'\\n');export function createComposition(){return {modules:[{poll:async()=>write('unexpected-poll')}],runtime:{queue:{tick:async()=>{write('started');await new Promise(r=>setTimeout(r,300));write('settled');return true;}},pool:{end:async()=>write('pool-ended')}}};}`;
  writeFileSync(hook, `import {registerHooks} from 'node:module';registerHooks({resolve(s,c,n){return s==='@ground/server'?{url:'mock:server',shortCircuit:true}:n(s,c);},load(u,c,n){return u==='mock:server'?{format:'module',source:${JSON.stringify(source)},shortCircuit:true}:n(u,c);}});`);
  const child = spawn(process.execPath, ['--import', hook, resolve(root, 'apps/worker/src/main.ts')], { stdio: 'pipe' });
  const exited = once(child, 'exit');
  const timeout = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    for (let attempt = 0; attempt < 200 && !existsSync(log); attempt++) await new Promise(r => setTimeout(r,10));
    assert.ok(existsSync(log), 'worker reached active tick');
    child.kill('SIGTERM');
    assert.ok(!readFileSync(log, 'utf8').includes('pool-ended'));
    const [code, signal] = await exited; assert.equal(code, 0); assert.equal(signal, null);
    assert.deepEqual(readFileSync(log, 'utf8').trim().split('\n'), ['started', 'settled', 'pool-ended']);
  } finally { clearTimeout(timeout); child.kill('SIGKILL'); rmSync(directory, { recursive: true, force: true }); }
});

test('real Fastify shutdown ends live SSE and still waits for an ordinary active request', async () => {
  const id='00000000-0000-4000-8000-000000000001';
  const context=actorContextSchema.parse({actor_id:id,project_id:id,run_id:id,roles:['admin'],permissions:['admin'],trusted_time:new Date().toISOString()});
  const snapshot=projectSnapshotSchema.parse({project_id:id,run_id:id,scenario_version:'1',scenario_date:'2026-09-12',project_version:1,event_cursor:0,members:[],locations:[],work:[],stock:[],issues:[],tasks:[],needs:[],proposals:[],requests:[],decisions:[],remote_links:[]});
  const pool=new pg.Pool();
  mock.method(pool,'connect',async()=>({query:async()=>({rows:[]}),release:()=>{}}));
  const service=new LiveService(new PgTransactions(pool),{snapshot:async()=>snapshot});
  assert.deepEqual(await service.state(context),liveStateSchema.parse({snapshot,events:[],checkpoints:[]}));
  class CheckSessions extends Sessions { override async context(){return context;} }
  const app=Fastify();
  let release!: () => void;
  let started!: () => void;
  const active=new Promise<void>(resolve=>{started=resolve;});
  const hold=new Promise<void>(resolve=>{release=resolve;});
  app.get('/ordinary',async()=>{started();await hold;return {done:true};});
  await liveModule(service,new CheckSessions(pool,'http://localhost')).registerRoutes(app);
  const address=await app.listen({host:'127.0.0.1',port:0});
  const response=await fetch(`${address}/api/projects/${id}/events`,{signal:AbortSignal.timeout(5000)});
  const reader=response.body?.getReader(); assert.ok(reader); await reader.read();
  const ordinary=fetch(`${address}/ordinary`,{headers:{Connection:'close'}}); await active;
  let closed=false; const closing=app.close().then(()=>{closed=true;});
  try {
    assert.equal((await reader.read()).done,true);
    assert.equal(closed,false);
    release(); const ordinaryResponse=await ordinary; assert.equal(ordinaryResponse.status,200); await ordinaryResponse.text(); await closing;
  } finally {release();await app.close();await pool.end();}
});
