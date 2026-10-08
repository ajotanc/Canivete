<script setup lang="ts">
import { SearchX } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState.vue'
</script>

<template>
  <section class="mx-auto w-full max-w-xl">
    <EmptyState page :icon="SearchX" description="Página não encontrada: o endereço que você tentou abrir não existe.">
      <Button as-child size="lg"><RouterLink to="/">Voltar para o início</RouterLink></Button>
    </EmptyState>
  </section>
</template>
