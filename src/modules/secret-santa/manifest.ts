import { Gift } from '@lucide/vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'secret-santa',
  title: 'Amigo secreto',
  description: 'Crie um grupo, convide as pessoas e sorteie. Cada uma vê só quem tirou.',
  icon: Gift,
  category: 'Sorteios',
  usesBackend: true,
  routes: [
    { path: '/secret-santa', name: 'secret-santa', component: () => import('./CreateGroupView.vue') },
    { path: '/secret-santa/g/:id', name: 'secret-santa-group', component: () => import('./GroupView.vue') },
    { path: '/secret-santa/g/:id/me', name: 'secret-santa-me', component: () => import('./MeView.vue') },
    { path: '/secret-santa/g/:id/admin', name: 'secret-santa-admin', component: () => import('./AdminView.vue') },
  ],
}

export default manifest
