<script setup lang="ts">
import { Moon, Sun, Wrench } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/core/theme/useTheme'

const { isDark, toggle } = useTheme()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-semibold">
          <Wrench class="size-5" />
          Canivete
        </RouterLink>
        <Button variant="ghost" size="icon" :aria-label="isDark ? 'Usar tema claro' : 'Usar tema escuro'" @click="toggle">
          <Sun v-if="isDark" class="size-5" />
          <Moon v-else class="size-5" />
        </Button>
      </div>
    </header>
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <RouterView />
    </main>
    <footer class="border-t py-4 text-center text-sm text-muted-foreground">
      Canivete: ferramentas simples para o dia a dia.
    </footer>
  </div>
</template>
