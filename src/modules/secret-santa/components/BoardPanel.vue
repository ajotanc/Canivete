<script setup lang="ts">
import { Megaphone, Send } from '@lucide/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listPosts, postMessage, SantaApiError, type BoardPost, type Credentials } from '../lib/api'

const props = defineProps<{ credentials: Credentials }>()

const posts = ref<BoardPost[]>([])
const text = ref('')
const sending = ref(false)

async function load() {
  try {
    posts.value = (await listPosts(props.credentials)).posts
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível carregar o mural.')
  }
}

onMounted(load)

async function onPost() {
  const value = text.value.trim()
  if (!value) return
  sending.value = true
  try {
    await postMessage({ ...props.credentials, text: value })
    text.value = ''
    await load()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível publicar.')
  } finally {
    sending.value = false
  }
}

function when(iso: string): string {
  return dayjs(iso).locale('pt-br').format('D MMM, HH:mm')
}
</script>

<template>
  <section class="space-y-4" aria-labelledby="board-title">
    <div class="space-y-1">
      <h2 id="board-title" class="flex items-center gap-2 font-display text-xl">
        <Megaphone class="size-5 text-primary" aria-hidden="true" />
        Mural do grupo
      </h2>
      <p class="text-sm text-muted-foreground">Recados para todo mundo. Aqui aparece quem escreveu.</p>
    </div>

    <form class="flex gap-2" @submit.prevent="onPost">
      <Input v-model="text" class="h-11" maxlength="300" autocomplete="off" placeholder="Escreva um recado" aria-label="Recado para o grupo" />
      <Button type="submit" class="h-11 shrink-0" :disabled="sending || !text.trim()">
        <Send class="size-4" aria-hidden="true" />
        Publicar
      </Button>
    </form>

    <p v-if="posts.length === 0" class="text-sm text-muted-foreground">Nenhum recado ainda. Seja a primeira pessoa.</p>
    <ul v-else class="space-y-2">
      <li v-for="post in posts" :key="post.id" class="rounded-lg border bg-card p-3">
        <p class="flex items-baseline justify-between gap-2 text-sm">
          <span class="font-semibold text-primary">{{ post.author }}</span>
          <time class="text-muted-foreground" :datetime="post.createdAt">{{ when(post.createdAt) }}</time>
        </p>
        <p class="mt-1 whitespace-pre-line break-words">{{ post.text }}</p>
      </li>
    </ul>
  </section>
</template>
