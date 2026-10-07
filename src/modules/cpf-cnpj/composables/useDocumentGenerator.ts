import { computed, ref, watch } from 'vue'
import { QUANTITIES, type DocumentType } from '../constants'
import { formatDocument, generateDocument } from '../lib/document'
import { secureRandomInt, type RandomInt } from '../lib/random'

/** Estado do gerador: tipo, quantidade e pontuação escolhidos, e os documentos gerados. */
export function useDocumentGenerator(random: RandomInt = secureRandomInt) {
  const type = ref<DocumentType>('cpf')
  const quantity = ref<number>(QUANTITIES[0])
  const formatted = ref(true)

  /** Guardados sem pontuação; `generatedType` evita formatar com a máscara errada no instante da troca. */
  const raw = ref<string[]>([])
  const generatedType = ref<DocumentType>(type.value)

  function generate() {
    generatedType.value = type.value
    raw.value = Array.from({ length: quantity.value }, () => generateDocument(type.value, random))
  }

  // Trocar o tipo ou a quantidade já gera de novo; a pontuação só muda a aparência do que existe.
  watch([type, quantity], generate, { immediate: true, flush: 'sync' })

  const items = computed(() => raw.value.map((value) => (formatted.value ? formatDocument(generatedType.value, value) : value)))

  return { type, quantity, formatted, items, generate }
}
