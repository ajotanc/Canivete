<script setup lang="ts">
import { History } from '@lucide/vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import type { Round } from '../composables/useRaffle'

defineProps<{ rounds: Round[] }>()

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <Empty v-if="rounds.length === 0" class="rounded-lg border border-dashed p-6">
    <EmptyHeader>
      <EmptyMedia variant="icon"><History aria-hidden="true" /></EmptyMedia>
      <EmptyTitle>Nenhum sorteio ainda</EmptyTitle>
      <EmptyDescription>Os sorteios desta sessão aparecem aqui.</EmptyDescription>
    </EmptyHeader>
  </Empty>
  <ItemGroup v-else class="gap-2">
    <Item v-for="round in rounds" :key="round.id" variant="muted" size="sm">
      <ItemContent>
        <ItemTitle>{{ round.winners.join(', ') }}</ItemTitle>
        <ItemDescription>{{ formatTime(round.drawnAt) }}</ItemDescription>
      </ItemContent>
    </Item>
  </ItemGroup>
</template>
