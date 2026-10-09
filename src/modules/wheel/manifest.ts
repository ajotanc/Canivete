import { CircleDot } from '@lucide/vue'
import PreviewWheel from './components/PreviewWheel.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'wheel',
  title: 'Roleta',
  description: 'Gire uma roleta com as suas opções e, se quiser, tire cada sorteada até sobrar uma.',
  icon: CircleDot,
  preview: PreviewWheel,
  category: 'Sorteios',
  usesBackend: false,
  routes: [{ path: '/wheel', name: 'wheel', component: () => import('./WheelView.vue') }],
}

export default manifest
