import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// Only this target replaces Phaser's browser lifecycle and storage feature probe.
// Fail closed if an engine update changes the pinned source we are adapting.
export default defineConfig({
  base: './', publicDir: false, optimizeDeps: { exclude: ['phaser'] },
  plugins: [{
    name: 'youtube-host-owned-phaser-lifecycle', enforce: 'pre',
    transform(source, id) {
      if (id.endsWith('/src/ui.ts')) return source.replaceAll('.toLocaleString()', ".toLocaleString('en')");
    },
    load(id) {
      if (!id.endsWith('/phaser/dist/phaser.esm.js')) return;
      const source = readFileSync(id, 'utf8');
      const lifecycle = /var VisibilityHandler = function \(game\)[\s\S]*?module\.exports = VisibilityHandler;/;
      const storage = 'Features.localStorage = !!localStorage.getItem;';
      if (!lifecycle.test(source) || !source.includes(storage)) throw new Error('Review Phaser host lifecycle patch after engine upgrade');
      return source.replace(lifecycle, 'var VisibilityHandler = function () {}; module.exports = VisibilityHandler;')
        .replace(storage, 'Features.localStorage = false;');
    },
  }],
  resolve: { alias: { phaser: fileURLToPath(new URL('./src/engine.js', import.meta.url)) } },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1600, rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
});
