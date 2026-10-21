import { defineConfig } from 'vite';
export default defineConfig(({ command, mode }) => ({
  base: './',
  define: {
    // Only the root Vercel production build opts in. Platform builds use their own configs/entries.
    'import.meta.env.WATER_HOLE_WEB_ANALYTICS': JSON.stringify(
      command === 'build' && mode === 'production' && process.env.NODE_ENV !== 'test' &&
      process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production' &&
      process.env.WATER_HOLE_BUILD_TARGET === 'vercel-web' && process.env.WATER_HOLE_DISABLE_ANALYTICS !== '1',
    ),
  },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } }, chunkSizeWarningLimit: 1600 },
}));
