import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      // Versão nova: o app avisa e a pessoa escolhe quando recarregar (recarregar sozinho apagaria a lista digitada).
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Canivete',
        short_name: 'Canivete',
        description: 'Ferramentas simples para o dia a dia.',
        lang: 'pt-BR',
        theme_color: '#0E1420',
        background_color: '#EEF1F4',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Rotas do app (ex.: /raffle/r/abc) abrem o index.html mesmo sem rede.
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Testes de lógica rodam em node; testes de componente declaram jsdom no próprio arquivo.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  server: {
    host: true,
    allowedHosts: [
      'dev.ajotanc.com.br'
    ]
  }
})
