import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Reuses the app's plugins (Tailwind, React, the `@` alias) so tests resolve
// imports exactly like the real build, and adds only test-specific config.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./js/test/setup.ts'],
      include: ['js/**/*.{test,spec}.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['js/**/*.{ts,tsx}'],
        exclude: ['js/**/*.d.ts', 'js/main.tsx', 'js/test/**'],
      },
    },
  }),
)
