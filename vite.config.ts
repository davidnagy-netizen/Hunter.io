import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // The server's pure-ESM engine (eligibility, scoring, profile
      // normalization) is imported directly rather than copied — see
      // features/scoring and README "Decisions".
      '@server-src': path.resolve(import.meta.dirname, '../src'),
    },
  },
  server: {
    fs: {
      // Allow the dev server to serve the engine files that live outside
      // frontend/.
      allow: [path.resolve(import.meta.dirname, '..')],
    },
    // Proxies API calls to the Node server (see ../server) so the browser
    // sees same-origin requests in dev — the session cookie is httpOnly +
    // SameSite=Lax, which a cross-origin dev setup would otherwise break.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
