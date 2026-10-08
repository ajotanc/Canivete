<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "@lucide/vue"
import { onBeforeUnmount, onMounted } from "vue"
import { toast, Toaster as Sonner } from "vue-sonner"
import "vue-sonner/style.css"
import { useTheme } from "@/core/theme/useTheme"
import { cn } from "@/lib/utils"

const props = defineProps<ToasterProps>()
const { isDark } = useTheme()

// Tocar em qualquer aviso fecha. O vue-sonner não expõe o id de cada aviso no DOM, então fecha os que estão na tela.
function dismissOnClick(event: MouseEvent) {
  if ((event.target as Element | null)?.closest("[data-sonner-toast]")) toast.dismiss()
}
onMounted(() => document.addEventListener("click", dismissOnClick))
onBeforeUnmount(() => document.removeEventListener("click", dismissOnClick))
</script>

<template>
  <Sonner
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    :class="cn('toaster group', props.class)"
    rich-colors
    :theme="isDark ? 'dark' : 'light'"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>
