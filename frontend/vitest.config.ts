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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/dict/DictDynamicForm.tsx',
        'src/dict/DictSimulatorTab.tsx',
        'src/relay/environment.ts',
        'src/shared/AppErrorBoundary.tsx',
        'src/shared/constants.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
  },
});
