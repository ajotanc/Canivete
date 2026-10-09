import { CaseSensitive } from '@lucide/vue'
import PreviewTextTools from './components/PreviewTextTools.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'text-tools',
  title: 'Ferramentas de texto',
  description: 'Troque maiúsculas e minúsculas, converta para camelCase ou slug, limpe listas e codifique em Base64 ou URL.',
  icon: CaseSensitive,
  preview: PreviewTextTools,
  category: 'Texto',
  usesBackend: false,
  routes: [{ path: '/text-tools', name: 'text-tools', component: () => import('./TextToolsView.vue') }],
}

export default manifest
