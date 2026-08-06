import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The distiller reads visibility, layout and accessible names, so unit tests
    // need a DOM. happy-dom keeps the suite fast enough to gate the build on.
    environment: 'happy-dom',
    include: ['packages/**/*.test.ts', 'evals/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
