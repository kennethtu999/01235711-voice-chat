import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://clouldflare-route.kenneth-tu.workers.dev/api/messages',
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
});
