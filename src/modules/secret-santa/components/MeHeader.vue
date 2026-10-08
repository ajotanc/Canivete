<script setup lang="ts">
import { ArrowLeft, CalendarDays, Coins, Gift, LayoutDashboard, LogOut, Users } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { eventCountdown, formatEventDate } from '../lib/event'
import { adminPath, invitePath } from '../lib/links'
import AddToCalendar from './AddToCalendar.vue'
import HeaderAction from './HeaderAction.vue'
import HeaderActions from './HeaderActions.vue'

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
    <FactList v-if="group">
      <FactTile :icon="Users" label="Participantes">{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
      <FactTile :icon="Coins" label="Valor sugerido">{{ group.budget !== null ? formatMoney(group.budget) : 'A definir' }}</FactTile>
      <FactTile :icon="CalendarDays" :label="group.eventDate ? eventCountdown(group.eventDate) : 'Data da troca'" tone="paper">{{ group.eventDate ? formatEventDate(group.eventDate) : 'A combinar' }}</FactTile>
    </FactList>
    <HeaderActions v-if="isOrganizer || group?.eventDate">
      <HeaderAction v-if="isOrganizer" as-child>
        <RouterLink :to="adminPath(groupId)"><LayoutDashboard aria-hidden="true" /><span>Painel do organizador</span></RouterLink>
      </HeaderAction>
      <AddToCalendar v-if="group?.eventDate" :group-id="groupId" :group-name="group.name" :event-date="group.eventDate" />
    </HeaderActions>
  </PageHeader>
</template>
