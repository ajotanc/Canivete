<script setup lang="ts">
import { ArrowLeft, ChevronRight, Gift } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import TagInput from '@/components/TagInput.vue'
import { parseMoney } from '@/lib/money'
import { createGroup, listMyGroups, SantaApiError, type MyGroup } from './lib/api'
import { adminPath } from './lib/links'
import { saveAdminToken, saveCredentials } from './lib/session'

const router = useRouter()

const step = ref(1)
const name = ref('')
const budget = ref('')
const eventDate = ref('')
const participates = ref(true)
const myName = ref('')
const myPin = ref('')
const myWishlist = ref<string[]>([])
const myGroups = ref<MyGroup[]>([])
const loading = ref(false)
const error = ref('')

// Grupos que esta sessão já criou: quem organiza mais de um amigo secreto escolhe qual abrir.
onMounted(async () => {
  try {
    myGroups.value = (await listMyGroups()).groups
  } catch {
    // Sem sessão ou sem rede: só não mostra a lista.
  }
})

const stepTitles = ['Como vai se chamar o grupo?', 'Valor e data (opcionais)', 'Você também participa?']
const canContinue = computed(() => {
  if (step.value === 1) return name.value.trim().length > 0
  if (step.value === 3 && participates.value) return myName.value.trim().length > 0 && /^\d{4,6}$/.test(myPin.value)
  return true
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { groupId, adminToken } = await createGroup({
      name: name.value,
      budget: parseMoney(budget.value),
      eventDate: eventDate.value,
      ...(participates.value
        ? { organizer: { name: myName.value, pin: myPin.value, wishlist: myWishlist.value } }
        : {}),
    })
    saveAdminToken(groupId, adminToken)
    if (participates.value) saveCredentials(groupId, { name: myName.value, pin: myPin.value })
    // O token vai no fragmento: não é enviado ao servidor.
    await router.push({ path: adminPath(groupId), hash: `#t=${adminToken}` })
  } catch (e) {
    error.value = e instanceof SantaApiError ? e.message : 'Não foi possível criar o grupo.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function onNext() {
  if (step.value < 3) step.value += 1
  else onSubmit()
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <header class="space-y-2">
      <Gift class="size-8 text-primary" aria-hidden="true" />
      <h1 class="font-display text-3xl leading-tight">Amigo secreto</h1>
      <p class="text-muted-foreground">Crie o grupo, cadastre as pessoas e sorteie. Cada uma vê só quem tirou.</p>
    </header>

    <div v-if="myGroups.length > 0" class="space-y-3">
      <h2 class="font-display text-xl">Seus amigos secretos</h2>
      <ul class="divide-y rounded-lg border bg-card">
        <li v-for="group in myGroups" :key="group.id">
          <RouterLink
            :to="adminPath(group.slug ?? group.id)"
            class="flex min-h-14 items-center justify-between gap-3 px-4 py-2 hover:bg-accent"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ group.name }}</span>
              <span class="block text-sm text-muted-foreground">{{ group.status === 'drawn' ? 'Já sorteado' : 'Aberto' }}</span>
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
      <p class="text-sm text-muted-foreground">Ou crie um novo grupo abaixo.</p>
    </div>

    <form class="space-y-6" @submit.prevent="onNext">
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">Passo {{ step }} de 3</p>
        <h2 class="font-display text-2xl leading-tight">{{ stepTitles[step - 1] }}</h2>
      </div>

      <div v-if="step === 1" class="space-y-2">
        <Label for="group-name">Nome do grupo</Label>
        <Input class="h-11" id="group-name" v-model="name" maxlength="80" autocomplete="off" placeholder="Família Silva" />
      </div>

      <div v-else-if="step === 2" class="space-y-4">
        <div class="space-y-2">
          <Label for="budget">Valor sugerido</Label>
          <Input id="budget" v-model="budget" v-money class="h-11" maxlength="20" placeholder="R$ 50,00" />
        </div>
        <div class="space-y-2">
          <Label for="event-date">Data da troca</Label>
          <Input class="h-11" id="event-date" v-model="eventDate" type="date" />
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center gap-3">
          <Switch id="participates" v-model="participates" />
          <Label for="participates">Quero entrar no sorteio</Label>
        </div>
        <template v-if="participates">
          <div class="space-y-2">
            <Label for="my-name">Seu nome</Label>
            <Input class="h-11" id="my-name" v-model="myName" maxlength="60" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <Label for="my-pin">PIN (4 a 6 números)</Label>
            <Input id="my-pin" v-model="myPin" v-maska data-maska="######" class="h-11" type="password" inputmode="numeric" autocomplete="off" />
            <p class="text-sm text-muted-foreground">Você usa o PIN para ver quem tirou. Anote, não dá para recuperar.</p>
          </div>
          <div class="space-y-2">
            <Label for="my-wishlist">O que você gostaria de ganhar</Label>
            <TagInput id="my-wishlist" v-model="myWishlist" placeholder="Digite um item e aperte Enter" />
          </div>
        </template>
        <p v-else class="text-sm text-muted-foreground">
          Você organiza o grupo e não entra no sorteio. Mesmo participando, você não vê os pares dos outros.
        </p>
      </div>

      <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

      <div class="flex items-center gap-3">
        <Button class="h-11" v-if="step > 1" type="button" variant="ghost" size="lg" @click="step -= 1">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button type="submit" size="lg" class="flex-1 h-11" :disabled="!canContinue || loading">
          {{ step < 3 ? 'Continuar' : loading ? 'Criando...' : 'Criar grupo' }}
        </Button>
      </div>
    </form>
  </section>
</template>
