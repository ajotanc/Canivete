<script setup lang="ts">
import { ArrowUp, Check, Download, FileText, House, Mail, Search, Share, ShieldCheck, Star } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { LEGAL } from '@/core/config'
import { favorites } from '@/core/home/favorites'
import { tools } from '@/core/modules/registry'
import { canInstall, install, isInstalled, needsManualInstall } from '@/core/pwa/install'

/** Rodapé do site: marca e instalação, atalhos, documentos e "voltar ao topo". */
const emit = defineEmits<{ search: [] }>()

const year = new Date().getFullYear()
const favoriteCount = computed(() => favorites.value.filter((id) => tools.some((tool) => tool.id === id)).length)

async function onInstall() {
  if (await install()) toast.success('Canivete instalado. Ele abre direto da tela inicial.')
}

function toTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

const linkClass =
  'inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-9'
</script>

<template>
  <footer class="mt-8 border-t bg-card/60">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_auto]">
      <!-- Marca e instalação -->
      <div class="space-y-5">
        <RouterLink to="/" class="inline-flex items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <img src="/icon.svg" alt="" width="36" height="36" class="size-9 rounded-lg" />
          Canivete
        </RouterLink>
        <p class="max-w-sm text-pretty text-muted-foreground">
          <span class="font-semibold text-foreground tabular-nums">{{ tools.length }} ferramentas</span> para o dia a dia, que abrem na hora e não pedem cadastro.
        </p>
        <div v-if="canInstall || isInstalled" class="flex flex-wrap gap-2">
          <Button v-if="canInstall" @click="onInstall"><Download aria-hidden="true" />Instalar o app</Button>
          <p v-else-if="isInstalled" class="flex h-11 items-center gap-2 rounded-lg border bg-background px-3.5 text-sm font-medium"><Check class="size-4 text-success" aria-hidden="true" />App instalado</p>
        </div>
        <p v-if="needsManualInstall" class="flex max-w-sm items-start gap-2 text-sm text-muted-foreground">
          <Share class="mt-0.5 size-4 shrink-0" aria-hidden="true" />No iPhone, toque em Compartilhar e depois em "Adicionar à Tela de Início" para ter o Canivete como app.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-10 lg:justify-self-end lg:gap-20">

        <nav aria-labelledby="footer-shortcuts" class="space-y-3">
          <h2 id="footer-shortcuts" class="text-sm font-semibold">Atalhos</h2>
          <ul class="space-y-1">
            <li><RouterLink to="/" :class="linkClass"><House class="size-4" aria-hidden="true" />Início</RouterLink></li>
            <li>
              <RouterLink to="/" :class="linkClass"><Star class="size-4" aria-hidden="true" />Favoritas<span v-if="favoriteCount" class="tabular-nums">({{ favoriteCount }})</span></RouterLink>
            </li>
            <li>
              <button type="button" :class="linkClass" @click="emit('search')"><Search class="size-4" aria-hidden="true" />Buscar</button>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-about" class="space-y-3">
          <h2 id="footer-about" class="text-sm font-semibold">Sobre</h2>
          <ul class="space-y-1">
            <li><RouterLink to="/privacy" :class="linkClass"><ShieldCheck class="size-4" aria-hidden="true" />Privacidade</RouterLink></li>
            <li><RouterLink to="/terms" :class="linkClass"><FileText class="size-4" aria-hidden="true" />Termos de uso</RouterLink></li>
            <li><a :href="`mailto:${LEGAL.contactEmail}`" :class="linkClass"><Mail class="size-4" aria-hidden="true" />Fale conosco</a></li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="border-t">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted-foreground">
        <p>© {{ year }} Canivete</p>
        <button
          type="button"
          class="group inline-flex h-11 items-center gap-2 rounded-lg px-3 font-medium outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          @click="toTop"
        >
          Voltar ao topo
          <ArrowUp class="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>
</template>
