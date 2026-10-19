import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { guitarTunaScraperPlugin } from './src/server/scraperPlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    guitarTunaScraperPlugin(),
  ],
  css: {
    // Avoid resolving parent directory's Laravel postcss.config.js
    postcss: {},
  },
  server: {
    port: 3000,
    host: true, // accessible on local network for testing on phones!
  },
});
