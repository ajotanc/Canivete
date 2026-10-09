import { computed, ref } from 'vue'

/** Evento que o Chrome, o Edge e o Android disparam quando o site pode ser instalado (não existe no Safari). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferred = ref<BeforeInstallPromptEvent | null>(null)
const standalone = ref(false)

/**
 * Escuta o convite de instalação. Precisa rodar logo no carregamento (é chamado no `main.ts`),
 * porque o navegador dispara o evento uma vez só, cedo.
 */
export function listenForInstall(): void {
  if (typeof window === 'undefined') return
  standalone.value = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    standalone.value = true
    deferred.value = null
  })
}

/** Já está aberto como app instalado. */
export const isInstalled = computed(() => standalone.value)
/** O navegador deixa instalar por um botão nosso. */
export const canInstall = computed(() => deferred.value !== null && !standalone.value)
/** iPhone e iPad: instala pelo menu Compartilhar, sem convite do navegador. */
export const needsManualInstall = computed(
  () => !standalone.value && deferred.value === null && typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent),
)

/** Abre o convite de instalação do navegador; devolve se a pessoa aceitou. */
export async function install(): Promise<boolean> {
  const event = deferred.value
  if (!event) return false
  await event.prompt()
  const { outcome } = await event.userChoice
  deferred.value = null
  return outcome === 'accepted'
}
