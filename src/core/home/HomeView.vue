<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { filterTools } from '@/core/home/filterTools'
import { tools } from '@/core/modules/registry'

const query = ref('')
const category = ref<string | null>(null)

const categories = computed(() => [...new Set(tools.map((tool) => tool.category))].sort())
const visibleTools = computed(() => filterTools(tools, query.value, category.value))
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Ferramentas</h1>
      <p class="text-muted-foreground">Escolha uma ferramenta para começar.</p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input v-model="query" type="search" placeholder="Buscar ferramenta..." class="sm:max-w-xs" />
      <div class="flex flex-wrap gap-2">
        <Badge
          :variant="category === null ? 'default' : 'outline'"
          class="cursor-pointer"
          @click="category = null"
        >
          Todas
        </Badge>
        <Badge
          v-for="item in categories"
          :key="item"
          :variant="category === item ? 'default' : 'outline'"
          class="cursor-pointer"
          @click="category = item"
        >
          {{ item }}
        </Badge>
      </div>
    </div>

    <p v-if="visibleTools.length === 0" class="py-12 text-center text-muted-foreground">
      Nenhuma ferramenta encontrada.
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink v-for="tool in visibleTools" :key="tool.id" :to="`/${tool.id}`">
        <Card class="h-full transition hover:border-primary hover:shadow-md">
          <CardHeader>
            <component :is="tool.icon" class="mb-2 size-8 text-primary" />
            <CardTitle>{{ tool.title }}</CardTitle>
            <CardDescription>{{ tool.description }}</CardDescription>
          </CardHeader>
        </Card>
      </RouterLink>
    </div>
  </section>
</template>
