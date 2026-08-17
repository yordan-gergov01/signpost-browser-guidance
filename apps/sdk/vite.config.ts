import { defineConfig } from 'vite';

/**
 * One file, nothing external, no module system asked of the host page.
 *
 * The embed has to survive being pasted into a tag manager by someone who is not
 * a front-end developer, so anything that needs a bundler on their side is not
 * an option.
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.ts',
      formats: ['iife'],
      name: 'SignpostEmbed',
      fileName: () => 'signpost.js',
    },
    target: 'es2020',
    sourcemap: true,
  },
});
