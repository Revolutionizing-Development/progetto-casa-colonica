import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/ai/multi-agent/tests/**/*.test.ts'],
    environment: 'node',
  },
});
