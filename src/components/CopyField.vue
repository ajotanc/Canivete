<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

/**
 * Campo só de leitura com o botão "Copiar" dentro, para links e números gerados.
 * Clicar no texto seleciona tudo, para copiar na mão se a área de transferência falhar.
 */
const props = defineProps<{
  value: string
  /** Nome do campo para leitores de tela (ex.: "Link"). */
  label: string
  /** Texto do aviso ao copiar. */
  message?: string
  placeholder?: string
  /** Classes do texto, para ajustar o tamanho da fonte. */
  inputClass?: string
}>()

const COPIED_FEEDBACK_MS = 1_600
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS)
    toast.success(props.message ?? 'Copiado.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <InputGroup class="h-12 bg-card">
    <InputGroupInput
      :model-value="value"
      readonly
      :aria-label="label"
      :placeholder="placeholder"
      :class="cn('text-sm', inputClass)"
      @focus="($event.target as HTMLInputElement).select()"
    />
    <InputGroupAddon align="inline-end">
      <InputGroupButton variant="ghost" size="icon-sm" :disabled="!value" :aria-label="`Copiar ${label.toLowerCase()}`" @click="copy">
        <Check v-if="copied" aria-hidden="true" />
        <Copy v-else aria-hidden="true" />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</template>
