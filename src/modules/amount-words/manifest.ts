import { ReceiptText } from '@lucide/vue'
import PreviewAmountWords from './components/PreviewAmountWords.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'amount-words',
  title: 'Valor por extenso',
  description: 'Escreva um valor em reais ou um número por extenso, em português, para recibos, cheques e contratos.',
  icon: ReceiptText,
  preview: PreviewAmountWords,
  category: 'Texto',
  usesBackend: false,
  routes: [{ path: '/amount-words', name: 'amount-words', component: () => import('./AmountWordsView.vue') }],
}

export default manifest
