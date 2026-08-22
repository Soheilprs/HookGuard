import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    root,
    include: [
      'apps/**/*.test.ts',
      'packages/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    environment: 'node',
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@hookguard/types': fileURLToPath(
        new URL('./packages/types/src/index.ts', import.meta.url),
      ),
      '@hookguard/config': fileURLToPath(
        new URL('./packages/config/src/index.ts', import.meta.url),
      ),
      '@hookguard/blockchain': fileURLToPath(
        new URL('./packages/blockchain/src/index.ts', import.meta.url),
      ),
    },
  },
});
