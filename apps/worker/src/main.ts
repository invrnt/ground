import { createComposition } from '@ground/server';
import { register } from './register';
console.info({ status: 'NOT_READY', registered_handlers: register(createComposition()).length });
const idle = setInterval(() => {}, 60_000);
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal, () => clearInterval(idle));
