import { ref } from 'vue'

const STORAGE_KEY = 'canivete-theme'
const isDark = ref(false)

/** Lê a preferência salva; se não houver (ou o storage falhar), o padrão é o tema claro. */
function readInitial(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved === 'dark'
  } catch {
    // Storage indisponível (modo privado, etc.): segue para o tema claro.
  }
  return false
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

/** Controla o tema claro/escuro e persiste a escolha. */
export function useTheme() {
  function init() {
    isDark.value = readInitial()
    apply(isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
    try {
      localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    } catch {
      // Sem persistência: o tema vale só nesta sessão.
    }
  }

  return { isDark, init, toggle }
}
