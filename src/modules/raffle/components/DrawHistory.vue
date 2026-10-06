<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { Round } from '../composables/useRaffle'

defineProps<{ rounds: Round[] }>()
const emit = defineEmits<{ clear: [] }>()

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">Histórico</h3>
      <Button v-if="rounds.length > 0" variant="ghost" size="sm" @click="emit('clear')">
        <Trash2 class="size-4" />
        Limpar
      </Button>
    </div>
    <p v-if="rounds.length === 0" class="text-sm text-muted-foreground">
      Os sorteios desta sessão aparecem aqui.
    </p>
    <ol v-else class="space-y-2">
      <li v-for="round in rounds" :key="round.id" class="rounded-md border px-3 py-2 text-sm">
        <span class="text-muted-foreground">{{ formatTime(round.drawnAt) }}</span>
        <span class="ml-2 font-medium">{{ round.winners.join(', ') }}</span>
      </li>
    </ol>
  </div>
</template>
