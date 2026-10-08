import { Type } from '@lucide/vue'
import PreviewTextCounter from './components/PreviewTextCounter.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'text-counter',
  title: 'Contador de texto',
  description: 'Conte caracteres, palavras e frases, veja o tempo de leitura e se o texto cabe nos limites do X, SMS e Google.',
  icon: Type,
  color: 'amber',
  preview: PreviewTextCounter,
  category: 'Texto',
  usesBackend: false,
  routes: [{ path: '/text-counter', name: 'text-counter', component: () => import('./TextCounterView.vue') }],
}

export default manifest
