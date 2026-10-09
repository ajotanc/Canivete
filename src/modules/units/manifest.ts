import { Ruler } from '@lucide/vue'
import PreviewUnits from './components/PreviewUnits.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'units',
  title: 'Conversor de unidades',
  description: 'Converta comprimento, peso, volume, temperatura, área, velocidade, tempo e dados entre as unidades mais usadas.',
  icon: Ruler,
  preview: PreviewUnits,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/units', name: 'units', component: () => import('./UnitsView.vue') }],
}

export default manifest
