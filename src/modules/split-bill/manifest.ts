import { HandCoins } from '@lucide/vue'
import PreviewSplitBill from './components/PreviewSplitBill.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'split-bill',
  title: 'Racha-conta',
  description: 'Divida a conta entre as pessoas, com gorjeta e os centavos fechando certinho, e copie o texto para o grupo.',
  icon: HandCoins,
  preview: PreviewSplitBill,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/split-bill', name: 'split-bill', component: () => import('./SplitBillView.vue') }],
}

export default manifest
