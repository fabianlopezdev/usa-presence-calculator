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
      // Add shared package internal aliases
      '@schemas': path.resolve(__dirname, '../shared/src/schemas'),
      '@business-logic': path.resolve(__dirname, '../shared/src/business-logic'),
      '@utils': path.resolve(__dirname, '../shared/src/utils'),
      '@types': path.resolve(__dirname, '../shared/src/types'),
      '@constants': path.resolve(__dirname, '../shared/src/constants'),
      '@errors': path.resolve(__dirname, '../shared/src/errors'),
    },
  },
});
