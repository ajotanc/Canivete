<script setup lang="ts">
import type { Component } from 'vue'
import { CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Título de cartão com ícone num quadrado colorido ao lado: o mesmo desenho em todas as cartas do amigo secreto.
 * O quadrado usa `rounded-chip` (raio proporcional ao lado); `destructive` serve para ações perigosas.
 */
withDefaults(defineProps<{ icon: Component; id?: string; tone?: 'primary' | 'destructive' }>(), { tone: 'primary' })
</script>

<template>
  <CardTitle :id="id" :class="cn('flex items-center gap-3 text-lg', tone === 'destructive' && 'text-destructive')">
    <span :class="cn('flex size-9 shrink-0 items-center justify-center rounded-chip border', tone === 'destructive' ? 'border-destructive/20 bg-destructive/10' : 'border-primary/20 bg-primary/10 text-primary')" aria-hidden="true">
      <component :is="icon" class="size-5" />
    </span>
    <slot />
  </CardTitle>
</template>
