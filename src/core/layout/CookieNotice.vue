<script setup lang="ts">
import { Cookie } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { LEGAL } from '@/core/config'

/**
 * Aviso de cookies. O site só usa o cookie de login do organizador (necessário) e guarda preferências no aparelho,
 * então é um aviso, sem escolha a fazer. Aparece uma vez e de novo quando a política muda (`LEGAL.updatedAt`).
 */
const visible = ref(false)

function seen(): boolean {
  try {
    return localStorage.getItem(LEGAL.noticeStorageKey) === LEGAL.updatedAt
  } catch {
    // Sem armazenamento, o aviso não teria como sumir de vez: melhor não insistir.
    return true
  }
}

onMounted(() => {
  visible.value = !seen()
})

function dismiss() {
  visible.value = false
  try {
    localStorage.setItem(LEGAL.noticeStorageKey, LEGAL.updatedAt)
  } catch {
    // Sem armazenamento: some só nesta visita.
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150 ease-out motion-reduce:transition-none"
    leave-to-class="translate-y-2 opacity-0"
  >
    <aside
      v-if="visible"
      class="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-[0_12px_28px_-12px_rgb(14_20_32/0.35)] sm:flex-row sm:items-center"
      aria-label="Aviso de cookies"
    >
      <span class="flex size-10 shrink-0 items-center justify-center rounded-chip border border-primary/20 bg-primary/10 text-primary max-sm:hidden" aria-hidden="true">
        <Cookie class="size-5" />
      </span>
      <p class="flex-1 text-sm text-pretty text-muted-foreground">
        Usamos só o cookie de login de quem organiza amigo secreto, e guardamos as suas preferências neste aparelho. Nada de rastreamento.
        <RouterLink to="/privacy" class="font-medium text-foreground underline underline-offset-4" @click="dismiss">Ver a política</RouterLink>
      </p>
      <Button class="shrink-0" @click="dismiss">Entendi</Button>
    </aside>
  </Transition>
</template>
