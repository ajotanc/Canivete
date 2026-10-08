<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Esqueleto de uma carta: título com o quadrado de ícone, linhas de descrição, campos (`rows`) e um botão.
 * As alturas seguem as da carta real (campo de 44px, botão de 44px) para a página não pular quando o conteúdo chega.
 */
withDefaults(defineProps<{ lines?: number; rows?: number; button?: boolean; block?: string }>(), { lines: 1, rows: 0, button: false })
</script>

<template>
  <Card aria-hidden="true">
    <CardHeader>
      <div class="flex items-center gap-3">
        <Skeleton class="size-9 shrink-0 rounded-chip" />
        <Skeleton class="h-5 w-40" />
      </div>
      <div v-if="lines > 0" class="space-y-2 pt-1">
        <Skeleton class="h-4 w-full" />
        <Skeleton v-if="lines > 1" class="h-4 w-2/3" />
      </div>
    </CardHeader>
    <CardContent v-if="rows > 0 || button || block" class="space-y-3">
      <Skeleton v-if="block" :class="block" />
      <Skeleton v-for="row in rows" :key="row" class="h-11 w-full rounded-lg" />
      <Skeleton v-if="button" class="h-11 w-full rounded-lg" />
    </CardContent>
  </Card>
</template>
