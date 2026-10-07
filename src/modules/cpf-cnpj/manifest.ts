import { IdCard } from '@lucide/vue'
import PreviewDocuments from './components/PreviewDocuments.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'cpf-cnpj',
  title: 'Gerador de CPF e CNPJ',
  description: 'Gere CPF, CNPJ ou o novo CNPJ com letras, com dígitos verificadores válidos.',
  icon: IdCard,
  color: 'pine',
  preview: PreviewDocuments,
  category: 'Desenvolvimento',
  usesBackend: false,
  routes: [{ path: '/cpf-cnpj', name: 'cpf-cnpj', component: () => import('./DocumentsView.vue') }],
}

export default manifest
