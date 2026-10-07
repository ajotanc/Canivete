import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { MESSAGES } from '../constants'

/** Avisa antes de sair da tela (navegação interna, fechar a aba ou recarregar) enquanto `dirty` for verdadeiro. */
export function useUnsavedGuard(dirty: Ref<boolean>): void {
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
  onBeforeRouteLeave(() => (dirty.value ? window.confirm(MESSAGES.unsavedChanges) : true))
}
