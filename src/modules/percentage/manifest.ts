import { Percent } from '@lucide/vue'
import PreviewPercentage from './components/PreviewPercentage.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'percentage',
  title: 'Calculadora de porcentagem',
  description: 'Calcule porcentagens, descontos, acréscimos, variações e juros simples ou compostos.',
  icon: Percent,
  color: 'pine',
  preview: PreviewPercentage,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/percentage', name: 'percentage', component: () => import('./PercentageView.vue') }],
}

export default manifest
