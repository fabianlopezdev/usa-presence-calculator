import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-utils/vitest-setup.ts'],
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src'),
      '@usa-presence/shared/schemas': path.resolve(__dirname, '../shared/src/schemas'),
      '@usa-presence/shared/constants': path.resolve(__dirname, '../shared/src/constants'),
      '@usa-presence/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});
