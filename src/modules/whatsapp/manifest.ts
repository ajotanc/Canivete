import PreviewWhatsapp from './components/PreviewWhatsapp.vue'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'whatsapp',
  title: 'Link de WhatsApp',
  description: 'Gere o link e o QR Code para abrir uma conversa no WhatsApp sem salvar o contato.',
  icon: WhatsappIcon,
  preview: PreviewWhatsapp,
  category: 'Comunicação',
  usesBackend: false,
  routes: [{ path: '/whatsapp', name: 'whatsapp', component: () => import('./WhatsappLinkView.vue') }],
}

export default manifest
