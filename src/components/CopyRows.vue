<script setup lang="ts">
import { Copy } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'

/**
 * Lista de campos (rótulo e valor) em que cada um tem o próprio botão de copiar.
 * Serve para resultados com vários dados, como um endereço ou uma pessoa de teste.
 */
defineProps<{ rows: ReadonlyArray<{ label: string; value: string }> }>()

async function copy(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado.`)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <dl class="grid gap-x-6 gap-y-1 sm:grid-cols-2">
    <div v-for="row in rows" :key="row.label" class="flex items-center justify-between gap-2 border-b py-1.5 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
      <div class="min-w-0">
        <dt class="text-xs text-muted-foreground">{{ row.label }}</dt>
        <dd class="break-words font-medium tabular-nums">{{ row.value }}</dd>
      </div>
      <Button variant="ghost" size="icon-sm" class="shrink-0" :aria-label="`Copiar ${row.label.toLowerCase()}`" @click="copy(row.label, row.value)">
        <Copy aria-hidden="true" />
      </Button>
    </div>
  </dl>
</template>
