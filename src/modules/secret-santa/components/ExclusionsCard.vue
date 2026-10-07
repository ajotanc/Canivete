<script setup lang="ts">
import { Ban, Plus, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { Button } from '@/components/ui/button'
import ComboboxField from '@/components/ComboboxField.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { SantaApiError, setExclusions } from '../lib/api'

const props = defineProps<{ groupId: string; names: string[]; exclusions: [string, string][] }>()
const emit = defineEmits<{ changed: [] }>()

const first = ref('')
const second = ref('')
const saving = ref(false)

const exists = computed(() =>
  props.exclusions.some(([a, b]) => (a === first.value && b === second.value) || (a === second.value && b === first.value)),
)
const canAdd = computed(() => first.value !== '' && second.value !== '' && first.value !== second.value && !exists.value)

async function save(next: [string, string][], success: string) {
  saving.value = true
  try {
    await setExclusions({ groupId: props.groupId, exclusions: next })
    toast.success(success)
    emit('changed')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar a regra.')
  } finally {
    saving.value = false
  }
}

async function add() {
  if (!canAdd.value) return
  await save([...props.exclusions, [first.value, second.value]], `${first.value} e ${second.value} não vão se tirar.`)
  first.value = ''
  second.value = ''
}

const removeIndex = ref<number | null>(null)

async function remove() {
  const index = removeIndex.value
  if (index === null) return
  await save(props.exclusions.filter((_, i) => i !== index), 'Regra removida.')
  removeIndex.value = null
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Quem não pode se tirar</CardTitle>
      <CardDescription>Útil para casais e quem mora junto. A regra vale nos dois sentidos.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <ul v-if="exclusions.length > 0" class="space-y-2">
        <li v-for="([a, b], index) in exclusions" :key="`${a}|${b}`" class="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-muted px-3 text-sm font-medium">
          <span class="flex min-w-0 items-center gap-2"><Ban class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span class="truncate">{{ a }} e {{ b }}</span></span>
          <Button type="button" variant="ghost" size="icon" :disabled="saving" :aria-label="`Remover regra de ${a} e ${b}`" @click="removeIndex = index">
            <X class="size-4" aria-hidden="true" />
          </Button>
        </li>
      </ul>

      <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="add">
        <Field>
          <FieldLabel for="excl-first">Pessoa</FieldLabel>
          <ComboboxField id="excl-first" v-model="first" :options="names" placeholder="Escolha a pessoa" search-placeholder="Buscar pessoa" empty-text="Ninguém com esse nome." />
        </Field>
        <Field>
          <FieldLabel for="excl-second">Não pode tirar</FieldLabel>
          <ComboboxField id="excl-second" v-model="second" :options="names.filter((n) => n !== first)" placeholder="Escolha a pessoa" search-placeholder="Buscar pessoa" empty-text="Ninguém com esse nome." />
        </Field>
        <Button type="submit" variant="outline" size="lg" class="sm:col-span-2" :disabled="!canAdd || saving">
          <Spinner v-if="saving" />
          <Plus v-else aria-hidden="true" />
          Adicionar regra
        </Button>
      </form>
    </CardContent>
    <ConfirmDelete
      :open="removeIndex !== null"
      title="Excluir esta regra?"
      :description="removeIndex !== null ? `${exclusions[removeIndex]?.[0]} e ${exclusions[removeIndex]?.[1]} poderão se tirar no sorteio.` : undefined"
      confirm-label="Excluir regra"
      :busy="saving"
      @update:open="(open: boolean) => !open && (removeIndex = null)"
      @confirm="remove"
    />
  </Card>
</template>
