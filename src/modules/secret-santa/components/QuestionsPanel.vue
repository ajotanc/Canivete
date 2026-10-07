<script setup lang="ts">
import { MessageCircleQuestion, Send } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
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
  <Card aria-labelledby="questions-title">
    <CardHeader>
      <CardTitle id="questions-title" class="flex items-center gap-2 text-lg">
        <MessageCircleQuestion class="size-5" aria-hidden="true" />
        Perguntas anônimas
      </CardTitle>
      <CardDescription>
        Pergunte algo a {{ receiverName }} sem se identificar, como "Você prefere chocolate ou vinho?". A resposta aparece só para você.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <form @submit.prevent="onAsk">
        <InputGroup class="h-11 bg-card">
          <InputGroupInput
            v-model="question"
            maxlength="200"
            autocomplete="off"
            :placeholder="`Pergunta para ${receiverName}`"
            aria-label="Pergunta anônima"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" variant="default" size="sm" :disabled="asking || !question.trim()">
              <Spinner v-if="asking" />
              <Send v-else aria-hidden="true" />
              Enviar
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div v-if="sent.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Suas perguntas</h3>
        <ItemGroup class="gap-2">
          <Item v-for="item in sent" :key="item.id" variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>{{ item.question }}</ItemTitle>
              <ItemDescription v-if="item.answer" class="line-clamp-none text-success">{{ item.answer }}</ItemDescription>
              <ItemDescription v-else>Ainda sem resposta.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </div>

      <div v-if="received.length > 0" class="space-y-2">
        <h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Perguntas para você
          <Badge v-if="received.some((item) => !item.answer)" variant="warning" class="rounded-md">{{ received.filter((item) => !item.answer).length }} sem resposta</Badge>
        </h3>
        <ItemGroup class="gap-2">
          <Item v-for="item in received" :key="item.id" variant="muted" size="sm" class="flex-col items-stretch">
            <ItemContent>
              <ItemTitle>{{ item.question }}</ItemTitle>
              <ItemDescription v-if="item.answer" class="line-clamp-none">Você respondeu: {{ item.answer }}</ItemDescription>
            </ItemContent>
            <form v-if="!item.answer" @submit.prevent="onAnswer(item)">
              <InputGroup class="h-11 bg-card">
                <InputGroupInput
                  v-model="drafts[item.id]"
                  maxlength="300"
                  autocomplete="off"
                  placeholder="Sua resposta"
                  :aria-label="`Resposta para: ${item.question}`"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="submit" variant="default" size="sm" :disabled="answeringId === item.id || !(drafts[item.id] ?? '').trim()">
                    <Spinner v-if="answeringId === item.id" />
                    Responder
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </Item>
        </ItemGroup>
      </div>
    </CardContent>
  </Card>
</template>
