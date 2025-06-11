import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/constants/*.ts',
    'src/schemas/*.ts',
    'src/utils/*.ts',
    'src/errors/*.ts',
    'src/business-logic/*.ts',
  ],
  format: ['cjs', 'esm'],
  dts: false, // We'll use tsc for declarations
  clean: true,
  sourcemap: true,
  minify: false,
  treeshake: true,
  splitting: false,
  tsconfig: 'tsconfig.json',
});
