import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Chama `refresh` quando a pessoa volta para a aba (ou para o app, no celular), no máximo uma vez por `minGapMs`.
 * Serve para telas que mostram o que os outros fazem (mural, perguntas, PINs criados) sem pedir para recarregar.
 */
export function useRefreshOnFocus(refresh: () => void | Promise<void>, minGapMs = 8000): void {
  let last = Date.now()

  function onVisibility() {
    if (document.visibilityState !== 'visible' || Date.now() - last < minGapMs) return
    last = Date.now()
    void refresh()
  }

  onMounted(() => document.addEventListener('visibilitychange', onVisibility))
  onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibility))
}
