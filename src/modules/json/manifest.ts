import { FileJson } from '@lucide/vue'
import PreviewJson from './components/PreviewJson.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'json',
  title: 'Formatador de JSON',
  description: 'Valide, formate, compacte e ordene um JSON, com o erro apontado na linha e na coluna.',
  icon: FileJson,
  preview: PreviewJson,
  category: 'Desenvolvimento',
  usesBackend: false,
  routes: [{ path: '/json', name: 'json', component: () => import('./JsonView.vue') }],
}

export default manifest
