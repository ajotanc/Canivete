<script setup lang="ts">
import { ExternalLink, Link2, QrCode, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import CopyField from '@/components/CopyField.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import QrCodeCard from '@/components/QrCodeCard.vue'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { buildWhatsappLink, MESSAGE_LIMIT, parsePhone } from './lib/whatsapp'

const phoneText = ref('')
const message = ref('')

const phone = computed(() => parsePhone(phoneText.value))
const link = computed(() => buildWhatsappLink(phone.value, message.value))
const tooLong = computed(() => message.value.length > MESSAGE_LIMIT)

</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="WhatsappIcon" title="Link de WhatsApp" description="Crie o link para abrir uma conversa sem salvar o contato, com a mensagem já escrita, e o QR Code para imprimir.">
      <FactList>
        <FactTile :icon="Link2" label="Link">WhatsApp</FactTile>
        <FactTile :icon="QrCode" label="QR Code">PNG e SVG</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Conversa</CardTitle>
          <CardDescription>O link e o QR Code se atualizam enquanto você digita.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field :data-invalid="phone.error ? true : undefined">
              <FieldLabel for="phone">Telefone</FieldLabel>
              <Input id="phone" v-model="phoneText" v-maska data-maska="['(##) ####-####', '(##) #####-####']" type="tel" inputmode="tel" autocomplete="off" placeholder="(11) 91234-5678" :aria-invalid="phone.error ? true : undefined" />
              <FieldError v-if="phone.error">{{ phone.error }}</FieldError>
              <FieldDescription v-else-if="phone.valid">Vai abrir {{ phone.display }}.</FieldDescription>
              <FieldDescription v-else>Número brasileiro, com DDD.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel for="message">Mensagem (opcional)</FieldLabel>
              <InputGroup class="bg-card">
                <InputGroupTextarea id="message" v-model="message" rows="5" placeholder="Olá! Vi seu anúncio e gostaria de saber mais." class="text-base" />
                <InputGroupAddon align="block-end" class="border-t">
                  <Badge variant="secondary" class="tabular-nums">{{ message.length }} {{ message.length === 1 ? 'caractere' : 'caracteres' }}</Badge>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription v-if="tooLong">Mensagem muito longa: o WhatsApp pode cortar o texto ao abrir o link.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Resultado</CardTitle>
          <CardDescription>{{ link ? 'Copie o link ou baixe o QR Code.' : 'Informe um telefone válido para gerar o link.' }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="space-y-2">
            <p class="text-sm font-medium">Link</p>
            <CopyField :value="link" label="Link" message="Link copiado." placeholder="https://api.whatsapp.com/send/…" />
            <Button as-child class="w-full" :disabled="!link">
              <a v-if="link" :href="link" target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                Abrir no WhatsApp
              </a>
              <span v-else>
                <ExternalLink aria-hidden="true" />
                Abrir no WhatsApp
              </span>
            </Button>
          </div>

          <QrCodeCard :value="link" filename="whatsapp-qrcode" label="QR Code do link de WhatsApp" />
          <p class="text-sm text-muted-foreground">O QR Code é gerado no seu navegador. Quem ler com a câmera abre a conversa direto no WhatsApp.</p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
