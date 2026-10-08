import { FileKey } from '@lucide/vue'
import PreviewJwt from './components/PreviewJwt.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'jwt',
  title: 'Decodificador de JWT',
  description: 'Leia o cabeçalho e o conteúdo de um token JWT, veja se expirou e confira a assinatura HS256, HS384 ou HS512.',
  icon: FileKey,
  color: 'berry',
  preview: PreviewJwt,
  category: 'Desenvolvimento',
  usesBackend: false,
  routes: [{ path: '/jwt', name: 'jwt', component: () => import('./JwtView.vue') }],
}

export default manifest
