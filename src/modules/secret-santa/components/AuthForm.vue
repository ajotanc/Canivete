<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div class="space-y-2">
      <h2 class="text-xl">{{ mode === 'login' ? 'Entre para organizar' : 'Crie sua conta de organizador' }}</h2>
      <p class="text-sm text-muted-foreground">
        A conta é só para quem organiza. Quem participa entra pelo link do grupo, com nome e PIN.
      </p>
    </div>

    <Tabs v-model="mode">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="login">Já tenho conta</TabsTrigger>
        <TabsTrigger value="register">Criar conta</TabsTrigger>
      </TabsList>
    </Tabs>

    <FieldGroup>
      <Field v-if="mode === 'register'">
        <FieldLabel for="auth-name">Seu nome</FieldLabel>
        <Input id="auth-name" v-model="name" maxlength="60" autocomplete="name" />
      </Field>
      <Field>
        <FieldLabel for="auth-email">E-mail</FieldLabel>
        <Input id="auth-email" v-model="email" type="email" autocomplete="email" />
      </Field>
      <Field>
        <FieldLabel for="auth-password">Senha</FieldLabel>
        <Input
          id="auth-password"
          v-model="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
        />
        <FieldDescription v-if="mode === 'register'">Pelo menos 8 caracteres.</FieldDescription>
      </Field>
      <FieldError v-if="error">{{ error }}</FieldError>
      <Button
        type="submit"
        size="lg"
        class="w-full"
        :disabled="loading || !email.trim() || password.length < 8 || (mode === 'register' && !name.trim())"
      >
        <Spinner v-if="loading" />
        {{ loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }}
      </Button>
    </FieldGroup>
  </form>
</template>
