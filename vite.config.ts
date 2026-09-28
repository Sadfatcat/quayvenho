/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

const srcDir = (dir: string) => fileURLToPath(new URL(`./src/${dir}`, import.meta.url));

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@domain': srcDir('domain'),
      '@data': srcDir('data'),
      '@ui': srcDir('ui'),
      '@scenes': srcDir('scenes'),
      '@save': srcDir('save'),
      '@platform': srcDir('platform'),
      '@dev': srcDir('dev'),
    },
  },
  plugins: mode === 'https' ? [basicSsl()] : [],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/__integration__/**', 'src/domain/models.ts'],
      thresholds: { lines: 90, branches: 85 },
    },
  },
}));
