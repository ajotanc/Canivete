import { Banknote } from '@lucide/vue'
import PreviewCurrency from './components/PreviewCurrency.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'currency',
  title: 'Conversor de moeda',
  description: 'Converta entre real, dólar, euro, libra, bitcoin e outras moedas com a cotação do momento.',
  icon: Banknote,
  color: 'pine',
  preview: PreviewCurrency,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/currency', name: 'currency', component: () => import('./CurrencyView.vue') }],
}

export default manifest
