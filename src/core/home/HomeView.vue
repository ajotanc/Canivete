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
    <div class="space-y-2 pt-2">
      <h1 class="font-display text-4xl leading-tight sm:text-5xl">Ferramentas</h1>
      <p class="max-w-prose text-lg text-muted-foreground">Escolha uma ferramenta para começar.</p>
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
      <RouterLink
        v-for="tool in visibleTools"
        :key="tool.id"
        :to="`/${tool.id}`"
        class="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card
          class="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          :class="tool.accent === 'secondary' ? 'group-hover:border-secondary' : 'group-hover:border-primary'"
        >
          <CardHeader>
            <span
              class="mb-3 flex size-12 items-center justify-center rounded-xl"
              :class="tool.accent === 'secondary' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'"
            >
              <component :is="tool.icon" class="size-6" aria-hidden="true" />
            </span>
            <CardTitle class="font-display text-xl">{{ tool.title }}</CardTitle>
            <CardDescription>{{ tool.description }}</CardDescription>
          </CardHeader>
        </Card>
      </RouterLink>
    </div>
  </section>
</template>
