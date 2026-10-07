import { Dices } from '@lucide/vue'
import PreviewRaffle from './components/PreviewRaffle.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'raffle',
  title: 'Sorteador de nomes',
  description: 'Sorteie um ou vários nomes, com animação, histórico e link verificável.',
  icon: Dices,
  color: 'cobalt',
  preview: PreviewRaffle,
  category: 'Sorteios',
  usesBackend: true,
  routes: [
    { path: '/raffle', name: 'raffle', component: () => import('./RaffleView.vue') },
    { path: '/raffle/r/:id', name: 'raffle-result', component: () => import('./SharedResultView.vue') },
  ],
}

export default manifest
