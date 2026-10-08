import { Fuel } from '@lucide/vue'
import PreviewFuel from './components/PreviewFuel.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'fuel',
  title: 'Gasolina ou etanol',
  description: 'Compare os preços no posto, pela regra dos 70% ou pelo consumo do seu carro, e veja o custo por km e da viagem.',
  icon: Fuel,
  color: 'amber',
  preview: PreviewFuel,
  category: 'Calculadoras',
  usesBackend: false,
  routes: [{ path: '/fuel', name: 'fuel', component: () => import('./FuelView.vue') }],
}

export default manifest
