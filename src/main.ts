import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './core/router'

createApp(App).use(router).mount('#app')

// Registra o service worker (PWA); ele se atualiza sozinho.
registerSW({ immediate: true })
