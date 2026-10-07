<script setup lang="ts">
import { CalendarPlus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { downloadEventIcs } from '../lib/calendar'

/** Baixa a data da troca como evento de dia inteiro, que abre em qualquer agenda. */
defineProps<{ groupId: string; groupName: string; eventDate: string }>()
</script>

<template>
  <Button type="button" variant="ghost" size="sm" @click="downloadEventIcs(groupId, groupName, eventDate)">
    <CalendarPlus aria-hidden="true" />
    Adicionar à agenda
  </Button>
</template>
