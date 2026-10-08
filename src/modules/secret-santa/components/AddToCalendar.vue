<script setup lang="ts">
import { CalendarPlus } from '@lucide/vue'
import { downloadEventIcs } from '../lib/calendar'
import HeaderAction from './HeaderAction.vue'

/** Baixa a data da troca como evento de dia inteiro, que abre em qualquer agenda. Vai dentro de `HeaderActions`. */
defineProps<{ groupId: string; groupName: string; eventDate: string }>()
</script>

<template>
  <HeaderAction type="button" @click="downloadEventIcs(groupId, groupName, eventDate)">
    <CalendarPlus aria-hidden="true" />
    <span>Adicionar à agenda</span>
  </HeaderAction>
</template>
