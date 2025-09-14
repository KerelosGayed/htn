import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as PluginOption],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
