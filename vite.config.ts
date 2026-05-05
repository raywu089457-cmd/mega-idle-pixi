import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    open: false,
  },
  base: './',  // Required for GitHub Pages (relative paths)
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
});