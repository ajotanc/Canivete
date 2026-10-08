<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Bloco de "nada aqui": borda tracejada, ícone num quadrado, descrição e, se precisar, título e ações embaixo.
 * Uso padrão: sempre `icon` e `description`; `title` só quando a descrição não basta.
 * `page` é a versão de tela inteira (estados de erro e de não encontrado); o padrão cabe dentro de uma carta.
 * Serve também para conteúdo bloqueado ou ainda vazio (ex.: lista que aparece depois de abrir a carta).
 */
withDefaults(defineProps<{ icon?: Component; title?: string; description?: string; page?: boolean; class?: string }>(), { page: false })
</script>

<template>
  <div :class="cn('flex min-w-0 flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center', page && 'gap-3 bg-card/50 py-12', $props.class)">
    <span v-if="icon" class="flex size-10 items-center justify-center rounded-chip border bg-muted text-muted-foreground" aria-hidden="true">
      <component :is="icon" class="size-5" />
    </span>
    <p v-if="title" class="text-balance font-medium">{{ title }}</p>
    <p v-if="description" class="text-pretty text-sm text-muted-foreground">{{ description }}</p>
    <slot />
  </div>
</template>
