import { MapPin } from '@lucide/vue'
import PreviewCep from './components/PreviewCep.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'cep',
  title: 'Consulta de CEP',
  description: 'Descubra o endereço de um CEP ou o CEP de uma rua, com bairro, cidade, estado, IBGE e DDD.',
  icon: MapPin,
  preview: PreviewCep,
  category: 'Utilidades',
  usesBackend: false,
  routes: [{ path: '/cep', name: 'cep', component: () => import('./CepView.vue') }],
}

export default manifest
