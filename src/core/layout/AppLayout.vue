<script setup lang="ts">
import { Moon, Search, Sun, Volume2, VolumeX } from '@lucide/vue'
import { computed, ref, watchEffect } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { soundEnabled, toggleSound } from '@/core/effects/sound'
import CommandPalette from '@/core/layout/CommandPalette.vue'
import CookieNotice from '@/core/layout/CookieNotice.vue'
import { tools } from '@/core/modules/registry'
import { useTheme } from '@/core/theme/useTheme'

const { isDark, toggle } = useTheme()
const route = useRoute()
const paletteOpen = ref(false)
const hasTool = computed(() => tools.some((item) => item.id === route.path.split('/')[1]))

// A cor de cabo da ferramenta aberta vale para a página toda, inclusive diálogos fora do layout.
watchEffect(() => {
  const tool = tools.find((item) => item.id === route.path.split('/')[1])
  if (tool) document.documentElement.dataset.tool = tool.color ?? 'cobalt'
  else delete document.documentElement.dataset.tool
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      Ir para o conteúdo
    </a>
    <header class="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <RouterLink
          to="/"
          class="flex items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <img src="/icon.svg" alt="" width="32" height="32" class="size-8 rounded-lg" />
          Canivete
        </RouterLink>

        <div class="ml-auto flex items-center gap-1.5">
          <Button variant="outline" class="gap-3 pr-2.5 text-muted-foreground max-sm:hidden" @click="paletteOpen = true">
            <Search class="size-4" aria-hidden="true" />
            Buscar ferramenta
            <Kbd>Ctrl K</Kbd>
          </Button>
          <Button variant="ghost" size="icon" class="hover:bg-transparent dark:hover:bg-transparent sm:hidden" aria-label="Buscar ferramenta" @click="paletteOpen = true">
            <Search class="size-5" aria-hidden="true" />
          </Button>
          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="hover:bg-transparent dark:hover:bg-transparent" :aria-label="soundEnabled ? 'Desligar o som' : 'Ligar o som'" :aria-pressed="soundEnabled" @click="toggleSound">
                  <Volume2 v-if="soundEnabled" class="size-5" aria-hidden="true" />
                  <VolumeX v-else class="size-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{ soundEnabled ? 'Som ligado' : 'Som desligado' }}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="hover:bg-transparent dark:hover:bg-transparent" :aria-label="isDark ? 'Usar tema claro' : 'Usar tema escuro'" @click="toggle">
                  <Sun v-if="isDark" class="size-5" aria-hidden="true" />
                  <Moon v-else class="size-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{ isDark ? 'Tema claro' : 'Tema escuro' }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <!-- A faixa de cabo: a cor da ferramenta aberta, a mesma do card na home. -->
      <div v-if="hasTool" class="h-1 bg-primary" aria-hidden="true" />
    </header>

    <main id="conteudo" class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <RouterView />
    </main>

    <footer class="border-t">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-muted-foreground">
        <p>Canivete: ferramentas simples para o dia a dia.</p>
        <nav class="flex items-center gap-4" aria-label="Documentos">
          <RouterLink to="/privacy" class="underline-offset-4 hover:text-foreground hover:underline">Privacidade</RouterLink>
          <RouterLink to="/terms" class="underline-offset-4 hover:text-foreground hover:underline">Termos de uso</RouterLink>
          <span class="max-sm:hidden">Aperte <Kbd>/</Kbd> para buscar</span>
        </nav>
      </div>
    </footer>

    <CommandPalette v-model:open="paletteOpen" />
    <CookieNotice />
  </div>
</template>
