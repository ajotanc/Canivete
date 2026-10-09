import { TextQuote } from '@lucide/vue'
import PreviewLorem from './components/PreviewLorem.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'lorem',
  title: 'Lorem ipsum',
  description: 'Gere texto de preenchimento em latim ou português: parágrafos, frases ou palavras, em texto puro ou HTML.',
  icon: TextQuote,
  preview: PreviewLorem,
  category: 'Texto',
  usesBackend: false,
  routes: [{ path: '/lorem', name: 'lorem', component: () => import('./LoremView.vue') }],
}

export default manifest
