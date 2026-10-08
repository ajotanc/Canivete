import { Coins } from '@lucide/vue'
import PreviewCoinDice from './components/PreviewCoinDice.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'coin-dice',
  title: 'Cara ou coroa e dados',
  description: 'Jogue uma moeda ou role de 1 a 10 dados de 4 a 100 faces para decidir na sorte.',
  icon: Coins,
  color: 'violet',
  preview: PreviewCoinDice,
  category: 'Sorteios',
  usesBackend: false,
  routes: [{ path: '/coin-dice', name: 'coin-dice', component: () => import('./CoinDiceView.vue') }],
}

export default manifest
