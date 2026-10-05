/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

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
  plugins: [
    ...(mode === 'https' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Quầy Vé Nhỏ',
        short_name: 'Quầy Vé Nhỏ',
        description: 'Game quản lý quầy bán vé máy bay',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fdf6ec',
        theme_color: '#fdf6ec',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2,json}'], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
    }),
  ],
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
