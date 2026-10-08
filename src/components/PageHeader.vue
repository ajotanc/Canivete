<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Cabeçalho padrão das páginas: título, descrição e, opcionalmente, ilustração, selo, ações e um link de voltar.
 *
 * Slots:
 * - `back`: link de voltar, no canto superior esquerdo.
 * - `actions`: ações da página (ex.: Sair), no canto superior direito.
 * - `media`: ilustração à esquerda do título.
 * - `badge`: selo ao lado do título (ex.: situação do grupo).
 * - padrão: conteúdo extra abaixo da descrição (selos, avisos).
 */
withDefaults(
  defineProps<{
    title: string
    description?: string
    /** Ícone da ferramenta, ao lado do título. */
    icon?: Component
    /** `lg` é o título grande da página inicial. */
    size?: 'default' | 'lg'
    /** Bloco inteiro na cor da ferramenta (convites e telas de abertura). */
    filled?: boolean
    class?: string
  }>(),
  { size: 'default', filled: false },
)
</script>

<template>
  <header :class="cn('space-y-3 sm:space-y-4', filled && 'rounded-3xl bg-primary p-5 text-primary-foreground sm:p-8 [&_[data-slot=button]:hover]:bg-transparent [&_[data-slot=button]:hover]:text-primary-foreground', $props.class)">
    <div v-if="$slots.back || $slots.actions" class="flex min-h-11 items-center justify-between gap-3">
      <div class="-ml-3"><slot name="back" /></div>
      <div class="-mr-3"><slot name="actions" /></div>
    </div>
    <div class="flex flex-col items-start gap-3 sm:gap-4">
      <span
        v-if="icon"
        :class="cn('flex size-14 shrink-0 items-center justify-center rounded-chip border', filled ? 'border-primary-foreground/20 bg-primary-foreground/15' : 'border-primary/20 bg-primary/10 text-primary')"
      >
        <component :is="icon" class="size-7" aria-hidden="true" />
      </span>
      <slot name="media" />
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-col items-start gap-2">
          <h1 :class="size === 'lg' ? 'text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl' : 'text-3xl leading-tight sm:text-4xl'">
            {{ title }}
          </h1>
          <slot name="badge" />
        </div>
        <p v-if="description" :class="cn('max-w-3xl text-balance text-base sm:text-lg', filled ? 'text-primary-foreground/90' : 'text-muted-foreground')">{{ description }}</p>
      </div>
    </div>
    <!-- Conteúdo extra (caixas de fatos, selos) ocupa a largura toda, abaixo do título -->
    <slot />
  </header>
</template>
