import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import relay from 'vite-plugin-relay';

export default defineConfig({
  plugins: [react(), relay],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
});
