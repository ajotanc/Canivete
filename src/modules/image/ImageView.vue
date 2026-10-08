<script setup lang="ts">
import { Download, ImageDown, ImageUp, Minimize2, Sliders, Trash2, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import FileField from '@/components/FileField.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FORMATS, fitWidth, formatBytes, isSupportedImage, MAX_FILE_MB, MAX_SIDE, outputName, sizeChangePercent, type OutputFormat } from './lib/image'

const WIDTH_PRESETS = [0, 1920, 1280, 800] as const

const file = ref<File | null>(null)
const bitmap = shallowRef<ImageBitmap | null>(null)
const originalUrl = ref('')
const error = ref('')

const format = ref<OutputFormat>('image/jpeg')
const quality = ref(80)
/** 0 = manter a largura original. */
const maxWidth = ref(0)

const resultBlob = shallowRef<Blob | null>(null)
const resultUrl = ref('')
const rendering = ref(false)

const lossy = computed(() => FORMATS.find((item) => item.value === format.value)?.lossy ?? false)
const target = computed(() => (bitmap.value ? fitWidth({ width: bitmap.value.width, height: bitmap.value.height }, Number(maxWidth.value) || 0) : null))
const change = computed(() => (file.value && resultBlob.value ? sizeChangePercent(file.value.size, resultBlob.value.size) : 0))

function revoke(url: string) {
  if (url) URL.revokeObjectURL(url)
}

function clear() {
  bitmap.value?.close()
  bitmap.value = null
  file.value = null
  revoke(originalUrl.value)
  revoke(resultUrl.value)
  originalUrl.value = ''
  resultUrl.value = ''
  resultBlob.value = null
  error.value = ''
}

async function onSelect(selected: File) {
  error.value = ''
  if (!isSupportedImage(selected.type)) {
    error.value = 'Esse arquivo não é uma imagem que o navegador abre (use JPEG, PNG, WebP, GIF, BMP ou AVIF).'
    return
  }
  if (selected.size > MAX_FILE_MB * 1_000_000) {
    error.value = `A imagem passa de ${MAX_FILE_MB} MB. Escolha uma menor.`
    return
  }
  try {
    const decoded = await createImageBitmap(selected)
    clear()
    bitmap.value = decoded
    file.value = selected
    originalUrl.value = URL.createObjectURL(selected)
  } catch {
    error.value = 'Não foi possível abrir essa imagem. Ela pode estar corrompida.'
  }
}

/** Só o resultado da última configuração vale: se mudar no meio, o anterior é descartado. */
let run = 0
async function render() {
  const source = bitmap.value
  const size = target.value
  if (!source || !size) return
  const current = ++run
  rendering.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(size.width, MAX_SIDE)
    canvas.height = Math.min(size.height, MAX_SIDE)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas')
    // JPEG não tem transparência: sem o fundo branco, o transparente viraria preto.
    if (format.value === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format.value, lossy.value ? quality.value / 100 : undefined))
    if (current !== run) return
    if (!blob) throw new Error('blob')
    revoke(resultUrl.value)
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
  } catch {
    if (current === run) error.value = 'Não foi possível converter a imagem. Tente outro formato.'
  } finally {
    if (current === run) rendering.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch([bitmap, format, quality, maxWidth], () => {
  clearTimeout(timer)
  timer = setTimeout(render, 150)
})

function onFormat(value: unknown) {
  if (FORMATS.some((item) => item.value === value)) format.value = value as OutputFormat
}
function onWidthPreset(value: unknown) {
  const amount = Number(value)
  if ((WIDTH_PRESETS as readonly number[]).includes(amount)) maxWidth.value = amount
}

function download() {
  if (!resultBlob.value || !file.value) return
  const link = document.createElement('a')
  link.href = resultUrl.value
  link.download = outputName(file.value.name, format.value)
  link.click()
  toast.success('Imagem salva.')
}

onBeforeUnmount(() => {
  clearTimeout(timer)
  clear()
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="ImageDown" title="Comprimir imagem" description="Reduza o peso e o tamanho de uma foto, escolha o formato e baixe pronta para enviar ou publicar.">
      <FactList>
        <FactTile :icon="Minimize2" label="Reduz">Peso e tamanho</FactTile>
        <FactTile :icon="Sliders" label="Formatos">JPEG, WebP, PNG</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem enviar nada</FactTile>
      </FactList>
    </PageHeader>

    <Alert v-if="error" variant="destructive" role="alert">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <FileField v-if="!file" id="image-file" accept="image/*" :icon="ImageUp" description="Toque para escolher uma imagem ou solte aqui. Ela não sai do seu aparelho." />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Como comprimir</CardTitle>
          <CardDescription class="break-all">{{ file.name }} · {{ bitmap?.width }} × {{ bitmap?.height }} px · {{ formatBytes(file.size) }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <Field>
            <FieldLabel for="format">Formato</FieldLabel>
            <ToggleGroup id="format" type="single" variant="outline" :model-value="format" aria-label="Formato" class="w-full bg-card" @update:model-value="onFormat">
              <ToggleGroupItem v-for="item in FORMATS" :key="item.value" :value="item.value" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ item.label }}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field v-if="lossy">
            <div class="flex items-baseline justify-between">
              <FieldLabel for="quality">Qualidade</FieldLabel>
              <span class="font-semibold tabular-nums">{{ quality }}%</span>
            </div>
            <Slider id="quality" thumb-label="Qualidade" :model-value="[quality]" :min="10" :max="100" :step="5" @update:model-value="quality = $event?.[0] ?? quality" />
          </Field>
          <Field>
            <FieldLabel for="width-preset">Largura máxima</FieldLabel>
            <ToggleGroup id="width-preset" type="single" variant="outline" :model-value="String(maxWidth)" aria-label="Largura máxima" class="w-full bg-card" @update:model-value="onWidthPreset">
              <ToggleGroupItem v-for="width in WIDTH_PRESETS" :key="width" :value="String(width)" class="flex-1 px-0 tabular-nums data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ width === 0 ? 'Original' : width }}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="width">Outra largura (px)</FieldLabel>
              <FieldDescription>0 mantém a original.</FieldDescription>
            </FieldContent>
            <NumberInput id="width" v-model="maxWidth" :min="0" :max="MAX_SIDE" :step="100" />
          </Field>
          <Button variant="outline" class="w-full" @click="clear">
            <Trash2 aria-hidden="true" />
            Trocar de imagem
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Resultado</CardTitle>
          <CardDescription v-if="target" class="tabular-nums">{{ target.width }} × {{ target.height }} px</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4" aria-live="polite">
          <div v-if="rendering || !resultUrl" class="space-y-3" aria-hidden="true">
            <Skeleton class="h-64 w-full rounded-xl" />
            <Skeleton class="h-11 w-full rounded-lg" />
          </div>
          <template v-else>
            <div class="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
              <img :src="resultUrl" alt="Prévia da imagem comprimida" class="max-h-96 w-auto max-w-full object-contain" />
            </div>
            <div class="flex flex-wrap items-center gap-2 tabular-nums">
              <span class="text-sm text-muted-foreground">{{ formatBytes(file.size) }}</span>
              <span aria-hidden="true">→</span>
              <span class="font-semibold">{{ formatBytes(resultBlob?.size ?? 0) }}</span>
              <Badge :variant="change < 0 ? 'success' : change > 0 ? 'warning' : 'secondary'">{{ change > 0 ? '+' : '' }}{{ change }}%</Badge>
            </div>
            <p v-if="change > 0" class="text-sm text-muted-foreground">O arquivo ficou maior. Baixe a qualidade, reduza a largura ou use JPEG ou WebP.</p>
            <Button size="lg" class="w-full" @click="download">
              <Download aria-hidden="true" />
              Baixar imagem
            </Button>
          </template>
        </CardContent>
      </Card>
    </div>

  </section>
</template>
