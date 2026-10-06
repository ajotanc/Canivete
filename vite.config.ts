import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Testes de lógica rodam em node; testes de componente declaram jsdom no próprio arquivo.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
