import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import { toast } from 'vue-sonner'
import App from './App.vue'
import { router } from './core/router'

createApp(App).use(router).mount('#app')

// Registra o service worker (PWA). Quando há versão nova, avisa e deixa a pessoa escolher o momento de recarregar.
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast('Há uma nova versão do Canivete.', {
      duration: Infinity,
      action: { label: 'Recarregar', onClick: () => updateServiceWorker(true) },
    })
  },
})
