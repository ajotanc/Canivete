import { PartyPopper } from '@lucide/vue'
import PreviewHolidays from './components/PreviewHolidays.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'holidays',
  title: 'Feriados do ano',
  description: 'Veja todos os feriados nacionais do ano, o dia da semana de cada um e quantos dias faltam para o próximo.',
  icon: PartyPopper,
  color: 'berry',
  preview: PreviewHolidays,
  category: 'Utilidades',
  usesBackend: false,
  routes: [{ path: '/holidays', name: 'holidays', component: () => import('./HolidaysView.vue') }],
}

export default manifest
