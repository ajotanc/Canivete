<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Palette } from '@lucide/vue'
import { parseColor, readableOn, toHex } from '@/lib/color'

/**
 * Campo de cor: texto livre (HEX, rgb() ou hsl()) e, ao lado, uma amostra que abre o seletor de cor do aparelho.
 * O seletor nativo fica invisível por cima da amostra: assim o tamanho e o desenho não dependem do navegador (no celular o ícone nativo quebra).
 */
const model = defineModel<string>({ required: true })
defineProps<{ id: string; label: string }>()

const color = computed(() => parseColor(model.value))
/** O seletor nativo só entende #rrggbb. */
const hex = computed(() => (color.value ? toHex(color.value) : '#000000'))

function onPick(event: Event) {
  model.value = (event.target as HTMLInputElement).value.toUpperCase()
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Input :id="id" v-model="model" autocomplete="off" spellcheck="false" class="min-w-0 flex-1 tabular-nums" :aria-invalid="model && !color ? true : undefined" />
    <label
      class="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border outline-none transition-transform focus-within:ring-3 focus-within:ring-ring/60 hover:scale-105 motion-reduce:transition-none"
      :style="{ background: color ? hex : 'conic-gradient(var(--berry), var(--amber), var(--pine), var(--cobalt), var(--violet), var(--berry))' }"
      :title="`Escolher ${label.toLowerCase()} no seletor`"
    >
      <Palette class="size-5" :class="color ? '' : 'drop-shadow'" :style="{ color: color ? toHex(readableOn(color)) : '#fff' }" aria-hidden="true" />
      <span class="sr-only">Escolher {{ label.toLowerCase() }} no seletor</span>
      <input type="color" :value="hex" class="absolute inset-0 size-full cursor-pointer opacity-0" @input="onPick" />
    </label>
  </div>
</template>
