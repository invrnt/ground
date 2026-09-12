import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.critical.test.ts', 'tests/release/**/*.test.ts'] } });
