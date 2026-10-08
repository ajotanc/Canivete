<script setup lang="ts">
import { Link2, Plus, Trash2 } from '@lucide/vue'
import { nextTick, ref, watch } from 'vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { Button } from '@/components/ui/button'
import { InputGroupInput } from '@/components/ui/input-group'
import { LIMITS } from '../constants'
import type { WishItem } from '../lib/api'

const props = withDefaults(defineProps<{ modelValue: WishItem[]; max?: number }>(), { max: LIMITS.wishlistItems })
const emit = defineEmits<{ (e: 'update:modelValue', value: WishItem[]): void }>()

interface Row {
  key: number
  text: string
  hasLink: boolean
  url: string
}

let nextKey = 0
const root = ref<HTMLElement | null>(null)
const toRows = (items: WishItem[]): Row[] =>
  items.map((item) => ({ key: nextKey++, text: item.text, hasLink: Boolean(item.url), url: item.url ?? '' }))
const toItems = (list: Row[]): WishItem[] =>
  list.map((row) => ({ text: row.text, ...(row.hasLink && row.url.trim() ? { url: row.url.trim() } : {}) }))

const rows = ref<Row[]>(toRows(props.modelValue))
let lastEmitted = JSON.stringify(toItems(rows.value))

// Troca vinda de fora (a lista carregou depois de a tela abrir): recria as linhas.
watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value) === lastEmitted) return
    rows.value = toRows(value)
    lastEmitted = JSON.stringify(toItems(rows.value))
  },
)

watch(
  rows,
  (list) => {
    const items = toItems(list)
    lastEmitted = JSON.stringify(items)
    emit('update:modelValue', items)
  },
  { deep: true },
)

async function add() {
  if (rows.value.length >= props.max) return
  rows.value.push({ key: nextKey++, text: '', hasLink: false, url: '' })
  await nextTick()
  const inputs = root.value?.querySelectorAll<HTMLInputElement>('[data-wish-text]')
  inputs?.[inputs.length - 1]?.focus()
}

const removeIndex = ref<number | null>(null)

/** Linha ainda vazia sai direto; com conteúdo, pede confirmação. */
function askRemove(index: number) {
  const row = rows.value[index]
  if (row && !row.text.trim() && !row.url.trim()) rows.value.splice(index, 1)
  else removeIndex.value = index
}

function remove() {
  if (removeIndex.value !== null) rows.value.splice(removeIndex.value, 1)
  removeIndex.value = null
}
</script>

<template>
  <div ref="root" class="space-y-3">
    <p v-if="rows.length === 0" class="rounded-2xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
      Nenhum presente na lista ainda.
    </p>

    <ul v-else class="space-y-3">
      <li class="overflow-hidden rounded-xl border bg-card shadow-xs has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50" v-for="(row, index) in rows" :key="row.key">
        <div class="flex items-center pr-1">
          <InputGroupInput
            v-model="row.text"
            data-wish-text
            :maxlength="LIMITS.wishlistText"
            placeholder="Ex.: meias de lã"
            :aria-label="`Presente ${index + 1}`"
            class="h-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-9 hover:bg-muted"
            :class="row.hasLink ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-muted-foreground'"
            :aria-pressed="row.hasLink"
            :aria-label="row.hasLink ? `Tirar o link de ${row.text || 'presente ' + (index + 1)}` : `Adicionar link de ${row.text || 'presente ' + (index + 1)}`"
            @click="row.hasLink = !row.hasLink"
          >
            <Link2 aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" class="size-9 text-destructive hover:bg-muted hover:text-destructive" :aria-label="`Remover ${row.text || 'presente ' + (index + 1)}`" @click="askRemove(index)">
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none" :class="row.hasLink ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
          <div class="overflow-hidden" :inert="!row.hasLink">
            <div class="flex items-center border-t pl-3">
              <Link2 class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <InputGroupInput
                v-model="row.url"
                type="url"
                inputmode="url"
                autocomplete="off"
                :maxlength="LIMITS.wishlistUrl"
                placeholder="Cole o link do produto"
                :aria-label="`Link de ${row.text || 'presente ' + (index + 1)}`"
                :tabindex="row.hasLink ? 0 : -1"
                class="h-11"
              />
            </div>
          </div>
        </div>
      </li>
    </ul>

    <Button type="button" variant="outline" size="lg" class="w-full hover:bg-muted" :disabled="rows.length >= max" @click="add">
      <Plus aria-hidden="true" />
      {{ rows.length >= max ? `Limite de ${max} presentes` : 'Adicionar presente' }}
    </Button>

    <ConfirmDelete
      :open="removeIndex !== null"
      title="Tirar este presente da lista?"
      :description="removeIndex !== null ? rows[removeIndex]?.text || undefined : undefined"
      confirm-label="Tirar da lista"
      @update:open="(open: boolean) => !open && (removeIndex = null)"
      @confirm="remove"
    />
  </div>
</template>
