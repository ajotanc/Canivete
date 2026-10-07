import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/** Gera os ícones do PWA (PNG, maskable, apple-touch e favicon) a partir de public/icon.svg. */
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // Ícones "maskable" e do iOS ganham margem e fundo na cor de fundo da logo (#212733), para o recorte do sistema.
    maskable: { sizes: [512], padding: 0.2, resizeOptions: { background: '#212733', fit: 'contain' } },
    apple: { sizes: [180], padding: 0.15, resizeOptions: { background: '#212733', fit: 'contain' } },
  },
  images: ['public/icon.svg'],
})
