import { KeyRound } from '@lucide/vue'
import PreviewPassword from './components/PreviewPassword.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'password',
  title: 'Gerador de senhas',
  description: 'Crie senhas e frases aleatórias fortes, escolha o tamanho e os caracteres, e veja a força de cada uma.',
  icon: KeyRound,
  preview: PreviewPassword,
  category: 'Segurança',
  usesBackend: false,
  routes: [{ path: '/password', name: 'password', component: () => import('./PasswordView.vue') }],
}

export default manifest
