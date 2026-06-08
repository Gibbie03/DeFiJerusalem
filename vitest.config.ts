import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: '.',
    include: ['server/**/*.test.ts', 'server/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
