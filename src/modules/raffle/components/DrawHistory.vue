<script setup lang="ts">
import { History } from '@lucide/vue'
import EmptyState from '@/components/EmptyState.vue'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import type { Round } from '../composables/useRaffle'

defineProps<{ rounds: Round[] }>()

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <EmptyState v-if="rounds.length === 0" :icon="History" description="Nenhum sorteio ainda. Os sorteios desta sessão aparecem aqui." />
  <ItemGroup v-else class="gap-2">
    <Item v-for="round in rounds" :key="round.id" variant="muted" size="sm">
      <ItemContent>
        <ItemTitle>{{ round.winners.join(', ') }}</ItemTitle>
        <ItemDescription>{{ formatTime(round.drawnAt) }}</ItemDescription>
      </ItemContent>
    </Item>
  </ItemGroup>
</template>
