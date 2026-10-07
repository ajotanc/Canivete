<script setup lang="ts">
import { Download, ImageDown, QrCode } from '@lucide/vue'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { downloadText, downloadUrl, qrPng, qrSvg } from '@/lib/qr'

/**
 * Mostra o QR Code de `value` e oferece baixar em PNG ou SVG.
 * Sem `value`, mostra um espaço reservado. O QR é gerado no navegador; nada sai do aparelho.
 */
const props = withDefaults(
  defineProps<{
    value: string
    /** Nome dos arquivos baixados, sem extensão. */
    filename?: string
    /** Cor dos módulos. */
    dark?: string
    /** Texto alternativo da imagem. */
    label?: string
  }>(),
  { filename: 'qrcode', dark: '#000000', label: 'QR Code' },
)

const svg = ref('')
const failed = ref(false)
let run = 0

watch(
  () => [props.value, props.dark] as const,
  async ([value, dark]) => {
    const current = ++run
    if (!value) {
      svg.value = ''
      failed.value = false
      return
    }
    try {
      const result = await qrSvg(value, { dark })
      if (current !== run) return
      svg.value = result
      failed.value = false
    } catch {
      if (current !== run) return
      svg.value = ''
      failed.value = true
    }
  },
  { immediate: true },
)

async function savePng() {
  try {
    downloadUrl(await qrPng(props.value, { dark: props.dark }), `${props.filename}.png`)
  } catch {
    toast.error('Não foi possível gerar a imagem.')
  }
}

function saveSvg() {
  downloadText(svg.value, `${props.filename}.svg`, 'image/svg+xml')
}
</script>

<template>
  <div class="space-y-4">
    <div class="mx-auto flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-2xl border bg-white p-2">
      <div v-if="svg" role="img" :aria-label="label" class="size-full [&>svg]:size-full" v-html="svg" />
      <div v-else class="flex flex-col items-center gap-2 p-6 text-center text-sm text-neutral-500">
        <QrCode class="size-10" aria-hidden="true" />
        <p role="status">{{ failed ? 'Texto grande demais para um QR Code. Reduza o conteúdo.' : 'O QR Code aparece aqui quando você preencher os campos.' }}</p>
      </div>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <Button variant="outline" :disabled="!svg" @click="savePng">
        <ImageDown aria-hidden="true" />
        Baixar PNG
      </Button>
      <Button variant="outline" :disabled="!svg" @click="saveSvg">
        <Download aria-hidden="true" />
        Baixar SVG
      </Button>
    </div>
  </div>
</template>
