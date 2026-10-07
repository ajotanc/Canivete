import { getCurrentScope, onScopeDispose, ref } from 'vue'
import { TIMING } from '../constants'

/** Controla a revelação do nome: aparece ao pedir e se esconde sozinho depois de um tempo. */
export function useReveal(autoHideMs: number = TIMING.revealAutoHideMs) {
  const revealed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function hide() {
    clearTimeout(timer)
    revealed.value = false
  }

  function reveal() {
    clearTimeout(timer)
    revealed.value = true
    timer = setTimeout(hide, autoHideMs)
  }

  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  return { revealed, reveal, hide }
}
