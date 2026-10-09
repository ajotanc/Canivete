import { Timer } from '@lucide/vue'
import PreviewTimer from './components/PreviewTimer.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'timer',
  title: 'Cronômetro e timer',
  description: 'Cronometre com voltas, faça uma contagem regressiva com aviso sonoro ou foque com o método Pomodoro.',
  icon: Timer,
  preview: PreviewTimer,
  category: 'Utilidades',
  usesBackend: false,
  routes: [{ path: '/timer', name: 'timer', component: () => import('./TimerView.vue') }],
}

export default manifest
