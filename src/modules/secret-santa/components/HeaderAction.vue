<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Ação do cabeçalho preenchido: ícone em cima, texto embaixo. Use dentro de `HeaderActions`.
 * `paper` é a ação principal (caixa clara); `glass` é a secundária, translúcida sobre a cor do cabeçalho.
 * O conteúdo é um ícone e um `<span>` com o texto; com `as-child`, o filho (ex.: RouterLink) vira o botão.
 */
withDefaults(defineProps<{ tone?: 'paper' | 'glass'; asChild?: boolean; class?: string }>(), { tone: 'glass', asChild: false })
</script>

<template>
  <Button
    variant="ghost"
    :as-child="asChild"
    :class="cn('h-auto flex-col justify-center gap-1 py-2.5 text-sm [&_svg]:size-5', tone === 'paper' ? 'bg-card text-card-foreground hover:bg-card/90' : 'bg-primary-foreground/15', $props.class)"
  >
    <slot />
  </Button>
</template>
