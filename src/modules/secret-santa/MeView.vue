<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import GiftTag from './components/GiftTag.vue'
import { useReveal } from './composables/useReveal'
import { revealMatch, SantaApiError, updateWishlist, type RevealResult } from './lib/api'
import { invitePath } from './lib/links'
import { clearCredentials, loadCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const result = ref<RevealResult | null>(null)
const wishlist = ref('')
const saving = ref(false)
const { revealed, reveal, hide } = useReveal()

const credentials = loadCredentials(groupId)

onMounted(async () => {
  // Sem credenciais na sessão (aba nova ou recarregada sem storage): volta para a tela de entrada.
  if (!credentials) {
    await router.replace(invitePath(groupId))
    return
  }
  try {
    result.value = await revealMatch({ groupId, ...credentials })
    wishlist.value = result.value.wishlist
    state.value = 'ready'
  } catch (e) {
    if (e instanceof SantaApiError && (e.code === 'BAD_CREDENTIALS' || e.code === 'LOCKED' || e.code === 'PIN_NOT_SET')) {
      clearCredentials(groupId)
      await router.replace(invitePath(groupId))
      return
    }
    errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir seu painel.'
    state.value = 'error'
  }
})

async function onSave() {
  if (!credentials) return
  saving.value = true
  try {
    await updateWishlist({ groupId, ...credentials, wishlist: wishlist.value })
    toast.success('Lista de desejos salva.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo seu painel...</p>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir seu painel</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button class="h-11" size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </div>

    <template v-else-if="result">
      <template v-if="result.status === 'drawn'">
        <header class="space-y-1">
          <h1 class="font-display text-3xl leading-tight">Você tirou</h1>
          <p class="text-muted-foreground">Toque em revelar. O nome some sozinho depois de 15 segundos.</p>
        </header>
        <GiftTag :name="result.receiver.name" :revealed="revealed" />
        <div class="flex justify-center">
          <Button class="h-11" v-if="!revealed" size="lg" @click="reveal">
            <Eye class="size-4" aria-hidden="true" />
            Revelar
          </Button>
          <Button class="h-11" v-else size="lg" variant="outline" @click="hide">
            <EyeOff class="size-4" aria-hidden="true" />
            Esconder
          </Button>
        </div>
        <div v-if="revealed" class="space-y-2">
          <h2 class="font-display text-xl">O que {{ result.receiver.name }} gostaria de ganhar</h2>
          <p class="whitespace-pre-line rounded-lg bg-card p-4">
            {{ result.receiver.wishlist || 'Ainda não escreveu nada.' }}
          </p>
        </div>
      </template>

      <template v-else>
        <header class="space-y-1">
          <h1 class="font-display text-3xl leading-tight">Tudo certo, {{ credentials?.name }}</h1>
          <p class="text-muted-foreground">O sorteio ainda não aconteceu. Quando o organizador sortear, volte aqui para ver quem você tirou.</p>
        </header>
        <form class="space-y-3" @submit.prevent="onSave">
          <Label for="my-wishlist">O que você gostaria de ganhar</Label>
          <Textarea id="my-wishlist" v-model="wishlist" maxlength="500" rows="4" />
          <Button type="submit" size="lg" class="w-full h-11" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar lista' }}</Button>
        </form>
        <Button class="h-11" as-child variant="ghost"><RouterLink :to="invitePath(groupId)">Voltar ao grupo</RouterLink></Button>
      </template>
    </template>
  </section>
</template>
