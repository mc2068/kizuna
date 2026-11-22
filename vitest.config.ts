import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
    // Role 3: jest-dom matchers and cleanup for the component tests (*.test.tsx run in jsdom).
    setupFiles: ['./vitest.setup.ts'],
    environment: 'node',
  },
});
