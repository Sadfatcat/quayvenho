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
    },
  },
  plugins: mode === 'https' ? [basicSsl()] : [],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
}));
