<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authErrorMessage, login, register } from '@/core/services/auth'

const emit = defineEmits<{ done: [] }>()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') await login(email.value, password.value)
    else await register(name.value, email.value, password.value)
    emit('done')
  } catch (e) {
    error.value = authErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <h2 class="font-display text-2xl leading-tight">
      {{ mode === 'login' ? 'Entre para organizar' : 'Crie sua conta de organizador' }}
    </h2>
    <p class="text-sm text-muted-foreground">
      A conta é só para quem organiza. Quem participa entra pelo link do grupo, com nome e PIN.
    </p>

    <div v-if="mode === 'register'" class="space-y-2">
      <Label for="auth-name">Seu nome</Label>
      <Input id="auth-name" v-model="name" class="h-11" maxlength="60" autocomplete="name" />
    </div>
    <div class="space-y-2">
      <Label for="auth-email">E-mail</Label>
      <Input id="auth-email" v-model="email" class="h-11" type="email" autocomplete="email" />
    </div>
    <div class="space-y-2">
      <Label for="auth-password">Senha</Label>
      <Input
        id="auth-password"
        v-model="password"
        class="h-11"
        type="password"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
        :placeholder="mode === 'register' ? 'Pelo menos 8 caracteres' : ''"
      />
    </div>

    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

    <Button
      type="submit"
      size="lg"
      class="h-11 w-full"
      :disabled="loading || !email.trim() || password.length < 8 || (mode === 'register' && !name.trim())"
    >
      {{ loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }}
    </Button>
    <Button
      type="button"
      variant="ghost"
      class="h-11 w-full"
      @click="mode = mode === 'login' ? 'register' : 'login'"
    >
      {{ mode === 'login' ? 'Não tenho conta' : 'Já tenho conta' }}
    </Button>
  </form>
</template>
