import { CalendarDays } from '@lucide/vue'
import PreviewDates from './components/PreviewDates.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'dates',
  title: 'Calculadora de datas',
  description: 'Calcule a diferença entre datas, some prazos em dias corridos ou úteis (com feriados) e descubra uma idade exata.',
  icon: CalendarDays,
  color: 'amber',
  preview: PreviewDates,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/dates', name: 'dates', component: () => import('./DatesView.vue') }],
}

export default manifest
