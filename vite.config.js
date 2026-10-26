import { defineConfig } from 'vite';
import { renderPage } from './src/page.js';

// The page markup is rendered from src/page.js + src/data at build time, so the
// built HTML is complete without JavaScript (contacts, services, links, copy).
const page = () => ({
  name: 'la-dependance-page',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace('<!--page-->', renderPage()) },
});

export default defineConfig({
  plugins: [page()],
  optimizeDeps: { entries: ['index.html'] },
  server: { watch: { ignored: ['**/site/**', '**/docs/**', '**/images/**', '**/references/**', '**/scripts/out/**', '**/qa/**'] } },
  build: { assetsInlineLimit: 0, target: 'es2020' },
});
