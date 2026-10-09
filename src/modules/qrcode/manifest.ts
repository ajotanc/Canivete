import { QrCode } from '@lucide/vue'
import PreviewQrCode from './components/PreviewQrCode.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'qrcode',
  title: 'Gerador de QR Code',
  description: 'Crie QR Codes de links, textos, redes Wi-Fi e cartões de contato, e baixe em PNG ou SVG.',
  icon: QrCode,
  preview: PreviewQrCode,
  category: 'Comunicação',
  usesBackend: false,
  routes: [{ path: '/qrcode', name: 'qrcode', component: () => import('./QrCodeView.vue') }],
}

export default manifest
