import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({ base:'./', publicDir:fileURLToPath(new URL('../../public',import.meta.url)), build:{outDir:'dist',emptyOutDir:true,rollupOptions:{output:{manualChunks:{phaser:['phaser']}}}} });
