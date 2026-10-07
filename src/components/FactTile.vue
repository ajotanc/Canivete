<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Caixa de fato para o cabeçalho preenchido (PageHeader `filled`): ícone, rótulo e valor.
 * `glass` é translúcida sobre a cor da ferramenta; `paper` é a caixa clara de destaque do cabeçalho (uma por tela).
 * Use dentro de um `<dl>`.
 */
withDefaults(
  defineProps<{
    icon: Component
    label: string
    tone?: 'glass' | 'paper'
    class?: string
  }>(),
  { tone: 'glass' },
)
</script>

<template>
  <div :class="cn('flex items-center gap-3 rounded-xl p-3', tone === 'paper' ? 'bg-card text-card-foreground shadow-sm' : 'bg-primary-foreground/15', $props.class)">
    <component :is="icon" class="size-5 shrink-0" aria-hidden="true" />
    <div class="min-w-0">
      <dt :class="cn('text-xs', tone === 'paper' ? 'text-muted-foreground' : 'text-primary-foreground/90')">{{ label }}</dt>
      <dd class="text-balance font-semibold leading-tight"><slot /></dd>
    </div>
  </div>
</template>
