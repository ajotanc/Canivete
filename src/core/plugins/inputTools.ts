import { vMaska } from 'maska/vue'
import type { App, Directive } from 'vue'
import { maskMoney } from '@/lib/money'

type MoneyElement = HTMLInputElement & { __moneyCleanup?: () => void; __moneyCurrency?: string }

function findInput(el: HTMLElement): HTMLInputElement | null {
  return el instanceof HTMLInputElement ? el : el.querySelector('input')
}

/** Formata o valor do campo e, se mudou, avisa o v-model (`input`) para ele guardar o texto formatado. */
function syncFormatted(input: MoneyElement) {
  const formatted = maskMoney(input.value, input.__moneyCurrency)
  if (formatted === input.value) return
  input.value = formatted
  input.dispatchEvent(new Event('input'))
}

/**
 * `v-money` no `<input>` (ou num componente cujo elemento raiz é um input): ao digitar (`input`),
 * sair do campo (`blur`) ou receber um valor de fora, o texto vira moeda ("R$ 50,00").
 * O valor da diretiva é o código da moeda (`v-money="'USD'"` vira "US$ 50,00"); sem valor, real.
 * Trocar a moeda refaz o texto com o novo símbolo, mantendo o número.
 * O v-model guarda o texto formatado; use `parseMoney` para obter o valor do banco.
 */
export const vMoney: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const input = findInput(el) as MoneyElement | null
    if (!input) return

    input.__moneyCurrency = binding.value || 'BRL'
    const apply = () => {
      const formatted = maskMoney(input.value, input.__moneyCurrency)
      if (formatted !== input.value) input.value = formatted
    }
    // O v-model grava o valor inicial depois deste hook: formata no microtask seguinte e avisa o modelo.
    queueMicrotask(() => syncFormatted(input))
    // Captura: formata antes do listener do v-model, que então lê o texto já formatado.
    input.addEventListener('input', apply, true)
    input.addEventListener('blur', apply)
    input.setAttribute('inputmode', 'numeric')
    input.__moneyCleanup = () => {
      input.removeEventListener('input', apply, true)
      input.removeEventListener('blur', apply)
    }
  },
  updated(el, binding) {
    const input = findInput(el) as MoneyElement | null
    if (!input) return
    input.__moneyCurrency = binding.value || 'BRL'
    syncFormatted(input)
  },
  unmounted(el) {
    ;(findInput(el) as MoneyElement | null)?.__moneyCleanup?.()
  },
}

/** Registra `v-money` (e `v-maska`) para todo o app. */
export const inputToolsPlugin = {
  install(app: App) {
    app.directive('money', vMoney)
    app.directive('maska', vMaska)
  },
}
