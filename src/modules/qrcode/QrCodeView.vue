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

const COLORS = [
  { label: 'Preto', value: '#111111' },
  { label: 'Azul', value: '#1d4ed8' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Vinho', value: '#9f1239' },
] as const

const kind = ref<Kind>('text')
const dark = ref<string>(COLORS[0].value)

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

function onColor(next: unknown) {
  if (typeof next === 'string' && next) dark.value = next
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">QR Code</CardTitle>
          <CardDescription>Gerado no seu navegador; nada é enviado a nenhum servidor.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <QrCodeCard :value="value" :dark="dark" :filename="filename" label="QR Code gerado" />
          <Field>
            <FieldContent>
              <FieldLabel>Cor</FieldLabel>
              <FieldDescription>Prefira cores escuras sobre o fundo branco.</FieldDescription>
            </FieldContent>
            <ToggleGroup type="single" variant="outline" :model-value="dark" aria-label="Cor do QR Code" class="w-full bg-card" @update:model-value="onColor">
              <ToggleGroupItem v-for="color in COLORS" :key="color.value" :value="color.value" :aria-label="color.label" class="h-11 flex-1 p-0">
                <span class="size-5 rounded-full border border-black/10" :style="{ backgroundColor: color.value }" />
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
