import { Palette } from '@lucide/vue'
import PreviewColors from './components/PreviewColors.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'colors',
  title: 'Cores',
  description: 'Converta cores entre HEX, RGB e HSL, veja os tons e confira o contraste do texto pelas regras WCAG.',
  icon: Palette,
  color: 'berry',
  preview: PreviewColors,
  category: 'Design',
  usesBackend: false,
  routes: [{ path: '/colors', name: 'colors', component: () => import('./ColorsView.vue') }],
}

export default manifest
