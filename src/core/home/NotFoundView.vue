<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <section class="space-y-4 py-16 text-center">
    <h1 class="text-3xl font-bold">Página não encontrada</h1>
    <p class="text-muted-foreground">O endereço que você tentou abrir não existe.</p>
    <Button as-child>
      <RouterLink to="/">Voltar para o início</RouterLink>
    </Button>
  </section>
</template>
