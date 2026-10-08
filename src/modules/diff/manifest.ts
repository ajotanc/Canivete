import { FileDiff } from '@lucide/vue'
import PreviewDiff from './components/PreviewDiff.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'diff',
  title: 'Comparador de texto',
  description: 'Compare duas versões de um texto e veja o que foi acrescentado, removido ou trocado, linha a linha e palavra a palavra.',
  icon: FileDiff,
  color: 'cobalt',
  preview: PreviewDiff,
  category: 'Texto',
  usesBackend: false,
  routes: [{ path: '/diff', name: 'diff', component: () => import('./DiffView.vue') }],
}

export default manifest
