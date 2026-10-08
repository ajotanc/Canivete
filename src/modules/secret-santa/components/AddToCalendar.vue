<script setup lang="ts">
import { CalendarPlus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { downloadEventIcs } from '../lib/calendar'

/** Baixa a data da troca como evento de dia inteiro, que abre em qualquer agenda. */
defineProps<{ groupId: string; groupName: string; eventDate: string }>()
</script>

<template>
  <Button type="button" variant="ghost" class="h-auto flex-col justify-center gap-1 bg-primary-foreground/15 py-2.5 text-sm [&_svg]:size-5" @click="downloadEventIcs(groupId, groupName, eventDate)">
    <CalendarPlus aria-hidden="true" />
    Adicionar à agenda
  </Button>
</template>
