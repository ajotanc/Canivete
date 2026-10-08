import { Fingerprint } from '@lucide/vue'
import PreviewHash from './components/PreviewHash.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'hash',
  title: 'UUID e hash',
  description: 'Gere UUIDs v4 e v7 e calcule SHA-1, SHA-256, SHA-384 e SHA-512, com ou sem chave HMAC, direto no navegador.',
  icon: Fingerprint,
  color: 'violet',
  preview: PreviewHash,
  category: 'Desenvolvimento',
  usesBackend: false,
  routes: [{ path: '/hash', name: 'hash', component: () => import('./HashView.vue') }],
}

export default manifest
