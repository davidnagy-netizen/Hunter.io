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
      // The scoring engine the browser runs, vendored unchanged from the
      // Node prototype — see vendor/engine-src/README.md.
      '@engine-src': path.resolve(import.meta.dirname, './vendor/engine-src'),
    },
  },
  server: {
    // Proxies API calls to the Laravel backend so the browser sees same-origin
    // requests in dev: the session cookie is httpOnly + SameSite=Lax, and the
    // API rejects cross-origin mutations (403 CSRF_REJECTED) by comparing the
    // request's Origin with its Host. So the proxy must NOT rewrite the Host
    // header — `changeOrigin` stays false (docs/FRONTEND-API.md in the backend).
    // Start the backend with: php artisan serve --host=127.0.0.1 --port=8000
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
