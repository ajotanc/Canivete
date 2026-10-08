<script setup lang="ts">
import { Megaphone, Send, Trash2 } from '@lucide/vue'
import CardHeading from './CardHeading.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState.vue'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import { LIMITS } from '../constants'
import { useRefreshOnFocus } from '../composables/useRefreshOnFocus'
import { deletePost, listPosts, postMessage, SantaApiError, type BoardPost, type Credentials } from '../lib/api'

/** Sem nome e PIN (painel do organizador), o mural é só para ler e moderar. */
const props = defineProps<{ credentials: { groupId: string } & Partial<Credentials> }>()
const canWrite = computed(() => Boolean(props.credentials.name && props.credentials.pin))

const posts = ref<BoardPost[]>([])
const text = ref('')
const sending = ref(false)

/** `silent`: atualização em segundo plano, que não incomoda com aviso de erro. */
async function load(silent = false) {
  try {
    posts.value = (await listPosts(props.credentials)).posts
  } catch (e) {
    if (!silent) toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível carregar o mural.')
  }
}

onMounted(() => load())
useRefreshOnFocus(() => load(true))

async function onPost() {
  const value = text.value.trim()
  if (!value || !props.credentials.name || !props.credentials.pin) return
  sending.value = true
  try {
    await postMessage({ groupId: props.credentials.groupId, name: props.credentials.name, pin: props.credentials.pin, text: value })
    text.value = ''
    await load()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível publicar.')
  } finally {
    sending.value = false
  }
}

const deleteTarget = ref<BoardPost | null>(null)
const deleting = ref(false)

async function onDelete(post: BoardPost) {
  deleting.value = true
  try {
    await deletePost({ ...props.credentials, postId: post.id })
    posts.value = posts.value.filter((p) => p.id !== post.id)
    toast.success('Recado apagado.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível apagar o recado.')
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

function when(iso: string): string {
  return dayjs(iso).locale('pt-br').format('D MMM, HH:mm')
}
</script>

<template>
  <Card aria-labelledby="board-title">
    <CardHeader>
      <CardHeading id="board-title" :icon="Megaphone">Mural do grupo</CardHeading>
      <CardDescription>Recados para todo mundo. Aqui aparece quem escreveu.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <form v-if="canWrite" @submit.prevent="onPost">
        <InputGroup class="h-11 bg-card">
          <InputGroupInput v-model="text" :maxlength="LIMITS.post" autocomplete="off" placeholder="Escreva um recado" aria-label="Recado para o grupo" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" variant="default" size="sm" :disabled="sending || !text.trim()">
              <Spinner v-if="sending" />
              <Send v-else aria-hidden="true" />
              Publicar
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <EmptyState v-if="posts.length === 0" title="Nenhum recado ainda" description="Seja a primeira pessoa a escrever." />
      <ItemGroup v-else class="gap-2">
        <Item v-for="post in posts" :key="post.id" variant="muted" size="sm" class="items-start">
          <ItemContent>
            <ItemTitle class="w-full justify-between">
              {{ post.author }}
              <time class="text-xs font-normal text-muted-foreground" :datetime="post.createdAt">{{ when(post.createdAt) }}</time>
            </ItemTitle>
            <ItemDescription class="line-clamp-none whitespace-pre-line break-words text-foreground">{{ post.text }}</ItemDescription>
          </ItemContent>
          <Button v-if="post.canDelete" type="button" variant="ghost" size="icon" class="-my-1 -mr-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" :aria-label="`Apagar recado de ${post.author}`" @click="deleteTarget = post">
            <Trash2 class="size-4" aria-hidden="true" />
          </Button>
        </Item>
      </ItemGroup>
    </CardContent>
    <ConfirmDelete
      :open="deleteTarget !== null"
      title="Apagar este recado?"
      :description="deleteTarget ? `O recado de ${deleteTarget.author} some do mural para todo mundo.` : undefined"
      confirm-label="Apagar recado"
      :busy="deleting"
      @update:open="(open: boolean) => !open && (deleteTarget = null)"
      @confirm="deleteTarget && onDelete(deleteTarget)"
    />
  </Card>
</template>
