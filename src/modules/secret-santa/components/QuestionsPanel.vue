<script setup lang="ts">
import { MessageCircleQuestion, Send } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { answerQuestion, askQuestion, listQuestions, SantaApiError, type Credentials, type QuestionItem } from '../lib/api'

const props = defineProps<{ credentials: Credentials; receiverName: string }>()

const received = ref<QuestionItem[]>([])
const sent = ref<QuestionItem[]>([])
const question = ref('')
const asking = ref(false)
/** Rascunho de resposta por id de pergunta. */
const drafts = ref<Record<string, string>>({})
const answeringId = ref<string | null>(null)

async function load() {
  try {
    const result = await listQuestions(props.credentials)
    received.value = result.received
    sent.value = result.sent
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível carregar as perguntas.')
  }
}

onMounted(load)

async function onAsk() {
  const text = question.value.trim()
  if (!text) return
  asking.value = true
  try {
    await askQuestion({ ...props.credentials, question: text })
    question.value = ''
    toast.success('Pergunta enviada. Ninguém vai saber que foi você.')
    await load()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível enviar.')
  } finally {
    asking.value = false
  }
}

async function onAnswer(item: QuestionItem) {
  const answer = (drafts.value[item.id] ?? '').trim()
  if (!answer) return
  answeringId.value = item.id
  try {
    await answerQuestion({ ...props.credentials, questionId: item.id, answer })
    toast.success('Resposta enviada.')
    await load()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível responder.')
  } finally {
    answeringId.value = null
  }
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="questions-title">
    <div class="space-y-1">
      <h2 id="questions-title" class="flex items-center gap-2 font-display text-xl">
        <MessageCircleQuestion class="size-5 text-secondary" aria-hidden="true" />
        Perguntas anônimas
      </h2>
      <p class="text-sm text-muted-foreground">
        Pergunte algo a {{ receiverName }} sem se identificar, como "Você prefere chocolate ou vinho?". A resposta aparece só para você.
      </p>
    </div>

    <form class="flex gap-2" @submit.prevent="onAsk">
      <Input
        v-model="question"
        class="h-11"
        maxlength="200"
        autocomplete="off"
        :placeholder="`Pergunta para ${receiverName}`"
        aria-label="Pergunta anônima"
      />
      <Button type="submit" class="h-11 shrink-0" :disabled="asking || !question.trim()">
        <Send class="size-4" aria-hidden="true" />
        Enviar
      </Button>
    </form>

    <div v-if="sent.length > 0" class="space-y-2">
      <h3 class="text-sm font-medium text-muted-foreground">Suas perguntas</h3>
      <ul class="space-y-2">
        <li v-for="item in sent" :key="item.id" class="rounded-lg border bg-card p-3">
          <p class="font-medium">{{ item.question }}</p>
          <p v-if="item.answer" class="mt-1 text-success">{{ item.answer }}</p>
          <p v-else class="mt-1 text-sm text-muted-foreground">Ainda sem resposta.</p>
        </li>
      </ul>
    </div>

    <div v-if="received.length > 0" class="space-y-2">
      <h3 class="text-sm font-medium text-muted-foreground">Perguntas para você</h3>
      <ul class="space-y-2">
        <li v-for="item in received" :key="item.id" class="space-y-2 rounded-lg border border-secondary/60 bg-card p-3">
          <p class="font-medium">{{ item.question }}</p>
          <p v-if="item.answer" class="text-sm text-muted-foreground">Você respondeu: {{ item.answer }}</p>
          <form v-else class="flex gap-2" @submit.prevent="onAnswer(item)">
            <Input v-model="drafts[item.id]" class="h-11" maxlength="300" autocomplete="off" placeholder="Sua resposta" :aria-label="`Resposta para: ${item.question}`" />
            <Button type="submit" class="h-11 shrink-0" :disabled="answeringId === item.id || !(drafts[item.id] ?? '').trim()">Responder</Button>
          </form>
        </li>
      </ul>
    </div>
  </section>
</template>
