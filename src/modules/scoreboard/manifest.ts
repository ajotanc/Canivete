import { Trophy } from '@lucide/vue'
import PreviewScoreboard from './components/PreviewScoreboard.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'scoreboard',
  title: 'Placar',
  description: 'Marque os pontos de cada jogador e jogue até uma meta. Fica salvo neste aparelho.',
  icon: Trophy,
  color: 'amber',
  preview: PreviewScoreboard,
  category: 'Diversão',
  usesBackend: false,
  routes: [{ path: '/scoreboard', name: 'scoreboard', component: () => import('./ScoreboardView.vue') }],
}

export default manifest
