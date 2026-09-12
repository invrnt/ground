import type { Composition } from '@ground/server';
export function register(composition: Composition) { return composition.modules.flatMap(module => Object.entries(module.jobs ?? {})); }
