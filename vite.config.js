import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'Frontend',
  build: {
    outDir: path.resolve(__dirname, 'wwwroot/dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: 'Frontend/main.js'
    }
  },
  server: {
    strictPort: true,
    port: 5173,
    hmr: {
        protocol: 'ws'
    }
  }
});
