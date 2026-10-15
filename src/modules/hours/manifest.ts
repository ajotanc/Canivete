import { Clock } from '@lucide/vue'
import PreviewHours from './components/PreviewHours.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'hours',
  title: 'Calculadora de horas',
  description: 'Calcule as horas trabalhadas entre dois horários, some e subtraia durações, descubra a hora de saída e conte as horas úteis entre datas.',
  icon: Clock,
  preview: PreviewHours,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/hours', name: 'hours', component: () => import('./HoursView.vue') }],
}

export default manifest
