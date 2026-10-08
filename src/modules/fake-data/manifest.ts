import { UsersRound } from '@lucide/vue'
import PreviewFakeData from './components/PreviewFakeData.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'fake-data',
  title: 'Dados fictícios',
  description: 'Gere pessoas de mentira com CPF válido, e-mail, telefone, nascimento e endereço, e copie em JSON.',
  icon: UsersRound,
  color: 'violet',
  preview: PreviewFakeData,
  category: 'Desenvolvimento',
  usesBackend: false,
  routes: [{ path: '/fake-data', name: 'fake-data', component: () => import('./FakeDataView.vue') }],
}

export default manifest
