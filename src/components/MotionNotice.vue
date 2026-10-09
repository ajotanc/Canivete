<script setup lang="ts">
import { Accessibility } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { forceMotion, systemReducesMotion } from '@/core/effects/motion'

/**
 * Aviso das ferramentas de giro (moeda, dados, roleta, sorteio): só aparece quando o sistema pede menos movimento.
 * Explica por que nada gira e deixa a pessoa escolher "Animar mesmo assim".
 */
const reduces = ref(systemReducesMotion())
let query: MediaQueryList | undefined

const update = () => (reduces.value = systemReducesMotion())

onMounted(() => {
  query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  query?.addEventListener?.('change', update)
})
onBeforeUnmount(() => query?.removeEventListener?.('change', update))
</script>

<template>
  <Alert v-if="reduces" variant="info">
    <Accessibility aria-hidden="true" />
    <AlertTitle>{{ forceMotion ? 'Animações ligadas' : 'Animações reduzidas' }}</AlertTitle>
    <AlertDescription>
      <p>
        {{ forceMotion ? 'Seu sistema pede menos movimento, mas você escolheu animar aqui.' : 'Seu sistema ou navegador pede menos movimento, então os giros ficam desligados e o resultado aparece direto.' }}
      </p>
      <Button type="button" variant="outline" size="sm" class="mt-3" :aria-pressed="forceMotion" @click="forceMotion = !forceMotion">
        {{ forceMotion ? 'Voltar a reduzir o movimento' : 'Animar mesmo assim' }}
      </Button>
    </AlertDescription>
  </Alert>
</template>
