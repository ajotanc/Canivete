<script setup lang="ts">
import { Contact, Link2, QrCode, Wifi, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import QrCodeCard from '@/components/QrCodeCard.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { contactPayload, wifiPayload, type WifiData } from './lib/payload'

type Kind = 'text' | 'wifi' | 'contact'

/** Cor usada enquanto nenhuma outra estiver escolhida. */
const DEFAULT_COLOR = '#111111'

const COLORS = [
  { label: 'Preto', value: DEFAULT_COLOR },
  { label: 'Azul', value: '#1d4ed8' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Vinho', value: '#9f1239' },
] as const

/** Razão de contraste mínima com o fundo branco para o QR Code continuar legível pelas câmeras. */
const MIN_CONTRAST = 3

const kind = ref<Kind>('text')
const dark = ref<string>(DEFAULT_COLOR)
const customColor = ref('#7c3aed')
const isCustom = computed(() => !COLORS.some((color) => color.value === dark.value))

/** Contraste (WCAG) da cor escolhida contra o branco. */
function contrastWithWhite(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 1.05 / (0.2126 * r! + 0.7152 * g! + 0.0722 * b! + 0.05)
}
const lowContrast = computed(() => contrastWithWhite(dark.value) < MIN_CONTRAST)

/** Clicar na cor já escolhida desmarca e volta ao preto. */
function onPreset(value: string, event: Event) {
  if (dark.value !== value) return
  event.preventDefault()
  dark.value = DEFAULT_COLOR
}

function onCustomColor(event: Event) {
  customColor.value = (event.target as HTMLInputElement).value
  dark.value = customColor.value
}

const text = ref('')
const wifi = ref<WifiData>({ ssid: '', password: '', security: 'WPA', hidden: false })
const contact = ref({ name: '', phone: '', email: '', organization: '', url: '' })

const value = computed(() => {
  if (kind.value === 'wifi') return wifiPayload(wifi.value)
  if (kind.value === 'contact') return contactPayload(contact.value)
  return text.value.trim()
})

const filename = computed(() => ({ text: 'qrcode', wifi: 'qrcode-wifi', contact: 'qrcode-contato' })[kind.value])

function onKind(next: unknown) {
  if (next === 'text' || next === 'wifi' || next === 'contact') kind.value = next
}

function onSecurity(next: unknown) {
  if (next === 'WPA' || next === 'WEP' || next === 'nopass') wifi.value.security = next
}

</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="QrCode" title="Gerador de QR Code" description="Transforme um link, um texto, o Wi-Fi ou um cartão de contato em QR Code e baixe a imagem.">
      <FactList>
        <FactTile :icon="Link2" label="Tipos">Link e mais</FactTile>
        <FactTile :icon="QrCode" label="Imagem">PNG e SVG</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Conteúdo</CardTitle>
          <CardDescription>Escolha o tipo e preencha. O QR Code se atualiza enquanto você digita.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs :model-value="kind" @update:model-value="onKind">
            <TabsList class="grid w-full grid-cols-3">
              <TabsTrigger value="text"><Link2 aria-hidden="true" />Link</TabsTrigger>
              <TabsTrigger value="wifi"><Wifi aria-hidden="true" />Wi-Fi</TabsTrigger>
              <TabsTrigger value="contact"><Contact aria-hidden="true" />Contato</TabsTrigger>
            </TabsList>

            <TabsContent value="text" class="pt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="qr-text">Link ou texto</FieldLabel>
                  <InputGroup class="bg-card">
                    <InputGroupTextarea id="qr-text" v-model="text" rows="5" placeholder="https://exemplo.com.br" class="text-base" />
                    <InputGroupAddon align="block-end" class="border-t">
                      <span class="text-xs text-muted-foreground tabular-nums">{{ text.length }} caracteres</span>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>Qualquer texto serve. Se for um link, comece com https://.</FieldDescription>
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="wifi" class="pt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="wifi-ssid">Nome da rede</FieldLabel>
                  <Input id="wifi-ssid" v-model="wifi.ssid" autocomplete="off" placeholder="Minha rede" />
                </Field>
                <Field>
                  <FieldLabel>Segurança</FieldLabel>
                  <ToggleGroup type="single" variant="outline" :model-value="wifi.security" aria-label="Segurança" class="w-full bg-card" @update:model-value="onSecurity">
                    <ToggleGroupItem value="WPA" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">WPA/WPA2</ToggleGroupItem>
                    <ToggleGroupItem value="WEP" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">WEP</ToggleGroupItem>
                    <ToggleGroupItem value="nopass" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Aberta</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
                <Field v-if="wifi.security !== 'nopass'">
                  <FieldLabel for="wifi-password">Senha</FieldLabel>
                  <Input id="wifi-password" v-model="wifi.password" autocomplete="off" />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel for="wifi-hidden">Rede oculta</FieldLabel>
                    <FieldDescription>A rede não aparece na lista do celular.</FieldDescription>
                  </FieldContent>
                  <Switch id="wifi-hidden" v-model="wifi.hidden" />
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="contact" class="pt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="contact-name">Nome</FieldLabel>
                  <Input id="contact-name" v-model="contact.name" autocomplete="off" placeholder="Ana Souza" />
                </Field>
                <Field>
                  <FieldLabel for="contact-org">Empresa (opcional)</FieldLabel>
                  <Input id="contact-org" v-model="contact.organization" autocomplete="off" />
                </Field>
                <Field>
                  <FieldLabel for="contact-phone">Telefone (opcional)</FieldLabel>
                  <Input id="contact-phone" v-model="contact.phone" v-maska data-maska="['(##) ####-####', '(##) #####-####']" type="tel" inputmode="tel" autocomplete="off" placeholder="(11) 91234-5678" />
                </Field>
                <Field>
                  <FieldLabel for="contact-email">E-mail (opcional)</FieldLabel>
                  <Input id="contact-email" v-model="contact.email" type="email" autocomplete="off" />
                </Field>
                <Field>
                  <FieldLabel for="contact-url">Site (opcional)</FieldLabel>
                  <Input id="contact-url" v-model="contact.url" type="url" autocomplete="off" placeholder="https://" />
                </Field>
              </FieldGroup>
            </TabsContent>
          </Tabs>

          <div class="mt-6 flex items-center justify-between gap-3 border-t pt-4">
            <span id="qr-color-label" class="text-sm font-medium">Cor</span>
            <div role="radiogroup" aria-labelledby="qr-color-label" class="flex items-center">
              <label v-for="color in COLORS" :key="color.value" class="group cursor-pointer" :title="color.label">
                <input v-model="dark" type="radio" name="qr-color" :value="color.value" :aria-label="color.label" class="sr-only" @click="onPreset(color.value, $event)" />
                <span class="flex size-11 items-center justify-center">
                  <span
                    class="size-7 rounded-full ring-offset-2 ring-offset-card transition-shadow group-has-[:checked]:ring-2 group-has-[:checked]:ring-primary group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none"
                    :style="{ backgroundColor: color.value }"
                  />
                </span>
              </label>
              <label class="group relative cursor-pointer" title="Escolher outra cor">
                <input type="color" :value="customColor" aria-label="Escolher outra cor" class="absolute inset-0 size-full cursor-pointer opacity-0" @input="onCustomColor" />
                <span class="flex size-11 items-center justify-center">
                  <span
                    class="size-7 rounded-full ring-offset-2 ring-offset-card transition-shadow group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none"
                    :class="isCustom && 'ring-2 ring-primary'"
                    :style="{ background: isCustom ? customColor : 'conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)' }"
                  />
                </span>
              </label>
            </div>
          </div>
          <p v-if="lowContrast" class="mt-1 text-sm text-warning" role="status">Cor muito clara: o QR Code pode não ser lido. Prefira um tom mais escuro.</p>
        </CardContent>
      </Card>

      <Card class="lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle class="text-lg">QR Code</CardTitle>
          <CardDescription>Gerado no seu navegador; nada é enviado a nenhum servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <QrCodeCard :value="value" :dark="dark" :filename="filename" label="QR Code gerado" />
        </CardContent>
      </Card>
    </div>
  </section>
</template>
