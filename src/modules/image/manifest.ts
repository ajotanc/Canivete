import { ImageDown } from '@lucide/vue'
import PreviewImage from './components/PreviewImage.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'image',
  title: 'Comprimir imagem',
  description: 'Reduza o peso e a largura de uma foto ou SVG, converta entre JPEG, WebP e PNG e baixe sem enviar nada para a internet.',
  icon: ImageDown,
  color: 'amber',
  preview: PreviewImage,
  category: 'Imagem',
  usesBackend: false,
  routes: [{ path: '/image', name: 'image', component: () => import('./ImageView.vue') }],
}

export default manifest
