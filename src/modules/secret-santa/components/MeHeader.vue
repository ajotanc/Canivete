<script setup lang="ts">
import { ArrowLeft, CalendarDays, Coins, Gift, LayoutDashboard, LogOut, Users } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { eventCountdown, formatEventDate } from '../lib/event'
import { adminPath, invitePath } from '../lib/links'
import AddToCalendar from './AddToCalendar.vue'

export interface MeGroupInfo {
  name: string
  budget: number | null
  eventDate: string
  participantCount: number
}

/** Cabeçalho do painel de quem participa: voltar ao grupo, painel do organizador, sair e dados do grupo. */
defineProps<{ groupId: string; group: MeGroupInfo | null; description: string; isOrganizer: boolean }>()
defineEmits<{ logout: [] }>()
</script>

<template>
  <PageHeader filled size="lg" :icon="Gift" :title="group?.name ?? 'Seu amigo secreto'" :description="description">
    <template #back>
      <Button as-child variant="ghost" size="sm">
        <RouterLink :to="invitePath(groupId)"><ArrowLeft aria-hidden="true" />Voltar ao grupo</RouterLink>
      </Button>
    </template>
    <template #actions>
      <Button type="button" variant="ghost" size="sm" @click="$emit('logout')">
        <LogOut aria-hidden="true" />
        Sair
      </Button>
    </template>
    <template #badge><slot name="badge" /></template>
    <dl v-if="group" class="grid grid-cols-2 gap-3 pt-2">
      <FactTile :icon="Users" label="Participantes">{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
      <FactTile v-if="group.budget !== null" :icon="Coins" label="Valor sugerido">{{ formatMoney(group.budget) }}</FactTile>
      <FactTile v-if="group.eventDate" :icon="CalendarDays" :label="eventCountdown(group.eventDate)" tone="paper" class="col-span-2">{{ formatEventDate(group.eventDate) }}</FactTile>
    </dl>
    <!-- Atalhos em linha própria: no celular "Voltar", "Painel" e "Sair" juntos não cabem lado a lado. -->
    <div v-if="isOrganizer || group?.eventDate" class="-ml-3 flex flex-wrap gap-2">
      <Button v-if="isOrganizer" as-child variant="ghost" size="sm">
        <RouterLink :to="adminPath(groupId)"><LayoutDashboard aria-hidden="true" />Painel do organizador</RouterLink>
      </Button>
      <AddToCalendar v-if="group?.eventDate" :group-id="groupId" :group-name="group.name" :event-date="group.eventDate" />
    </div>
  </PageHeader>
</template>
