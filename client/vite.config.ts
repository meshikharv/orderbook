import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const isDemo = process.env.VITE_DEMO_MODE === 'true';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves from /orderbook/ — only applied in demo/pages build
  base: isDemo ? '/orderbook/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': { target: 'ws://localhost:3001', ws: true },
    },
  },
});
