import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend port for the /api dev proxy. Defaults to the documented 4000; set
// VITE_API_PORT to point at a different API (e.g. when 4000 is already taken
// by another process on the machine).
const apiPort = process.env.VITE_API_PORT || '4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
