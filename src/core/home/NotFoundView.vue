<script setup lang="ts">
import { SearchX } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
</script>

<template>
  <section class="mx-auto w-full max-w-xl">
    <Empty class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchX aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Página não encontrada</EmptyTitle>
        <EmptyDescription>O endereço que você tentou abrir não existe.</EmptyDescription>
      </EmptyHeader>
      <Button as-child size="lg"><RouterLink to="/">Voltar para o início</RouterLink></Button>
    </Empty>
  </section>
</template>
