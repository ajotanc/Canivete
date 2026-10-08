import { CircleDot } from '@lucide/vue'
import PreviewWheel from './components/PreviewWheel.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'wheel',
  title: 'Roleta',
  description: 'Coloque as opções, gire a roleta e deixe a sorte decidir, com a opção de tirar cada sorteada até sobrar uma.',
  icon: CircleDot,
  color: 'violet',
  preview: PreviewWheel,
  category: 'Sorteios',
  usesBackend: false,
  routes: [{ path: '/wheel', name: 'wheel', component: () => import('./WheelView.vue') }],
}

export default manifest
