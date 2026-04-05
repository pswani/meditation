import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendHost = process.env.MEDITATION_BACKEND_BIND_HOST ?? '127.0.0.1';
const backendPort = process.env.MEDITATION_BACKEND_PORT ?? '8080';
const proxyTarget = `http://${backendHost}:${backendPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': proxyTarget,
    },
  },
});
