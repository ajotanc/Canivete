<script setup lang="ts">
import { ArrowLeft, ChevronRight, Gift, LogOut } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import TagInput from '@/components/TagInput.vue'
import { loadUser, logout, useAuth } from '@/core/services/auth'
import AuthForm from './components/AuthForm.vue'
import { parseMoney } from '@/lib/money'
import { isUsableSlug, slugifyInput, trimSlug } from './lib/slug'
import { createGroup, listMyGroups, SantaApiError, type MyGroup } from './lib/api'
import { adminPath } from './lib/links'
import { saveCredentials } from './lib/session'

const router = useRouter()
const { user, ready } = useAuth()

const step = ref(1)
const name = ref('')
const slug = ref('')
/** Enquanto a pessoa não mexe no texto do link, ele acompanha o nome do grupo. */
const slugTouched = ref(false)
const budget = ref('')
const eventDate = ref('')
const participates = ref(true)
const myName = ref('')
const myPin = ref('')
const myWishlist = ref<string[]>([])
const myGroups = ref<MyGroup[]>([])
const loading = ref(false)
const error = ref('')

function onNameInput(event: Event) {
  // Lê do campo, porque o v-model do Input atualiza `name` só depois deste evento.
  if (!slugTouched.value) slug.value = trimSlug(slugifyInput((event.target as HTMLInputElement).value))
}

function onSlugInput(event: Event) {
  const input = event.target as HTMLInputElement
  slugTouched.value = true
  slug.value = slugifyInput(input.value)
  input.value = slug.value
}

// O nome da conta já vem preenchido como o nome de quem participa (dá para trocar).
watch(
  user,
  (current) => {
    if (current && !myName.value) myName.value = current.name
  },
  { immediate: true },
)

// Grupos da conta: quem organiza mais de um amigo secreto escolhe qual abrir.
async function loadMyGroups() {
  try {
    myGroups.value = (await listMyGroups()).groups
  } catch {
    // Sem rede: só não mostra a lista.
  }
}

onMounted(async () => {
  await loadUser()
  if (user.value) await loadMyGroups()
})

async function onLogout() {
  await logout()
  myGroups.value = []
  step.value = 1
}

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
    const { groupId } = await createGroup({
      name: name.value,
      ...(isUsableSlug(trimSlug(slug.value)) ? { slug: trimSlug(slug.value) } : {}),
      budget: parseMoney(budget.value),
      eventDate: eventDate.value,
      ...(participates.value
        ? { organizer: { name: myName.value, pin: myPin.value, wishlist: myWishlist.value } }
        : {}),
    })
    if (participates.value) saveCredentials(groupId, { name: myName.value, pin: myPin.value })
    await router.push(adminPath(groupId))
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

    <p v-if="!ready" class="py-8 text-center text-muted-foreground">Carregando...</p>

    <AuthForm v-else-if="!user" @done="loadMyGroups" />

    <template v-else>
    <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span class="min-w-0 truncate">Conectado como {{ user.email }}</span>
      <Button variant="ghost" size="sm" @click="onLogout">
        <LogOut class="size-4" aria-hidden="true" />
        Sair
      </Button>
    </div>

    <div v-if="myGroups.length > 0" class="space-y-3">
      <h2 class="font-display text-xl">Seus amigos secretos</h2>
      <ul class="divide-y rounded-lg border bg-card">
        <li v-for="group in myGroups" :key="group.id">
          <RouterLink
            :to="adminPath(group.id)"
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
        <Input class="h-11" id="group-name" v-model="name" maxlength="80" autocomplete="off" placeholder="Família Silva" @input="onNameInput" />
        <Label for="group-slug" class="pt-2">Texto do link (opcional)</Label>
        <Input
          id="group-slug"
          :value="slug"
          class="h-11"
          maxlength="40"
          autocomplete="off"
          placeholder="familia-silva"
          @input="onSlugInput"
          @blur="slug = trimSlug(slug)"
        />
        <p class="text-sm text-muted-foreground">Vem do nome do grupo; pode trocar. Ex.: .../g/k7x2m9/{{ trimSlug(slug) || 'familia-silva' }}</p>
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
            <Input class="h-11" id="my-name" v-model="myName" maxlength="60" autocomplete="off" data-1p-ignore data-lpignore="true" />
          </div>
          <div class="space-y-2">
            <Label for="my-pin">PIN (4 a 6 números)</Label>
            <Input id="my-pin" v-model="myPin" v-maska data-maska="######" class="h-11 [-webkit-text-security:disc]" type="text" inputmode="numeric" autocomplete="off" data-1p-ignore data-lpignore="true" />
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
    </template>
  </section>
</template>
