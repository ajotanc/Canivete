<script setup lang="ts">
import { BadgeCheck, CircleAlert, Eraser, FileKey, KeyRound, ShieldAlert, ShieldCheck, Zap } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/EmptyState.vue'
import { play } from '@/core/effects/sound'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { decodeJwt, describeClaims, expiryOf, verifyJwt, type Verification } from './lib/jwt'

const text = ref('')
const secret = ref('')

const result = computed(() => (text.value.trim() ? decodeJwt(text.value) : null))
const decoded = computed(() => (result.value?.ok ? result.value.token : null))
/** Hora atual em segundos, lida ao decodificar para o status acompanhar o token colado. */
const now = computed(() => (decoded.value ? Math.floor(Date.now() / 1000) : 0))
const expiry = computed(() => (decoded.value ? expiryOf(decoded.value.payload, now.value) : null))
const claims = computed(() => (decoded.value ? describeClaims(decoded.value.payload, now.value) : []))
const algorithm = computed(() => String(decoded.value?.header.alg ?? ''))
const pretty = (value: unknown) => JSON.stringify(value, null, 2)

// Confere a assinatura quando há chave; a resposta de um token ou chave antigos é descartada.
const verification = ref<Verification | null>(null)
let run = 0
watch([decoded, secret], async () => {
  const current = ++run
  if (!decoded.value || !secret.value) {
    verification.value = null
    return
  }
  try {
    const outcome = await verifyJwt(decoded.value, secret.value)
    if (current === run) {
      // Só o acerto toca: errar a chave enquanto se digita não deve apitar a cada letra.
      if (outcome === 'valid' && verification.value !== 'valid') play('success')
      verification.value = outcome
    }
  } catch {
    if (current === run) verification.value = null
  }
})

async function copy(value: string, message: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(message)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="FileKey" title="Decodificador de JWT" description="Cole um token JWT para ler o cabeçalho e o conteúdo, ver se expirou e conferir a assinatura com a chave.">
      <FactList>
        <FactTile :icon="BadgeCheck" label="Lê">Conteúdo</FactTile>
        <FactTile :icon="KeyRound" label="Assinatura">HS256 a 512</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Fica no aparelho</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">O token</CardTitle>
        <CardDescription>O token e a chave não saem do seu aparelho. Mesmo assim, evite colar tokens de produção em qualquer site.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Field>
          <FieldLabel for="token" class="sr-only">Token JWT</FieldLabel>
          <InputGroup class="bg-card">
            <InputGroupTextarea id="token" v-model="text" spellcheck="false" autocapitalize="off" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" class="h-32 min-h-0 flex-none resize-none overflow-y-auto break-all text-sm field-sizing-fixed" :aria-invalid="result && !result.ok ? true : undefined" />
            <InputGroupAddon align="block-end" class="justify-end border-t">
              <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!text" @click="text = ''">
                <Eraser aria-hidden="true" />
                Limpar
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Alert v-if="result && !result.ok" variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{{ result.error }}</AlertDescription>
        </Alert>
        <p v-else-if="decoded" class="break-all text-sm leading-relaxed" aria-label="Token colorido por parte">
          <span class="text-info">{{ decoded.parts[0] }}</span><span class="text-muted-foreground">.</span><span class="text-success">{{ decoded.parts[1] }}</span><span class="text-muted-foreground">.</span><span class="text-warning">{{ decoded.parts[2] }}</span>
        </p>
      </CardContent>
    </Card>

    <EmptyState v-if="!decoded && !(result && !result.ok)" :icon="FileKey" description="Cole um token acima para ver o que tem dentro." />

    <template v-if="decoded">
      <Alert v-if="expiry === 'expired'" variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Token expirado</AlertTitle>
        <AlertDescription>A data de expiração já passou.</AlertDescription>
      </Alert>
      <Alert v-else-if="expiry === 'not-yet'" variant="warning">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Ainda não vale</AlertTitle>
        <AlertDescription>O token só passa a valer na data de início (nbf).</AlertDescription>
      </Alert>
      <Alert v-else-if="expiry === 'valid'" variant="success">
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Dentro da validade</AlertTitle>
        <AlertDescription>A data de expiração ainda não chegou. Isso não prova que o token é autêntico: só a assinatura prova.</AlertDescription>
      </Alert>
      <Alert v-else variant="info">
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Sem data de expiração</AlertTitle>
        <AlertDescription>O token não tem o campo exp, então nunca expira por conta própria.</AlertDescription>
      </Alert>
      <Alert v-if="algorithm.toLowerCase() === 'none'" variant="warning">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Sem assinatura</AlertTitle>
        <AlertDescription>O algoritmo é "none": qualquer pessoa poderia ter criado este token. Servidores não devem aceitar isso.</AlertDescription>
      </Alert>

      <div class="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg text-info">Cabeçalho</CardTitle>
            <CardDescription>Algoritmo e tipo do token.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <pre class="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-card p-3 text-sm">{{ pretty(decoded.header) }}</pre>
            <Button variant="outline" size="sm" @click="copy(pretty(decoded.header), 'Cabeçalho copiado.')">Copiar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg text-success">Conteúdo</CardTitle>
            <CardDescription>Os dados que o token carrega (payload).</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <pre class="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-card p-3 text-sm">{{ pretty(decoded.payload) }}</pre>
            <Button variant="outline" size="sm" @click="copy(pretty(decoded.payload), 'Conteúdo copiado.')">Copiar</Button>
          </CardContent>
        </Card>
      </div>

      <Card v-if="claims.length">
        <CardHeader>
          <CardTitle class="text-lg">Campos padrão</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="divide-y">
            <div v-for="claim in claims" :key="claim.name" class="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt class="text-sm text-muted-foreground">{{ claim.label }} <span class="text-xs">({{ claim.name }})</span></dt>
              <dd class="font-medium tabular-nums sm:text-right">
                <template v-if="claim.date">{{ claim.date.text }} <span class="font-normal text-muted-foreground">· {{ claim.date.relative }}</span></template>
                <template v-else>{{ claim.value }}</template>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg text-warning">Assinatura</CardTitle>
          <CardDescription>Para conferir se o token é autêntico, informe a chave usada para assinar (só HS256, HS384 e HS512).</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Field>
            <FieldLabel for="secret">Chave secreta</FieldLabel>
            <Input id="secret" v-model="secret" autocomplete="off" spellcheck="false" placeholder="your-256-bit-secret" />
          </Field>
          <Alert v-if="verification === 'valid'" variant="success" role="status">
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>Assinatura confere</AlertTitle>
            <AlertDescription>O token foi assinado com essa chave e não foi alterado.</AlertDescription>
          </Alert>
          <Alert v-else-if="verification === 'invalid'" variant="destructive" role="status">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Assinatura não confere</AlertTitle>
            <AlertDescription>A chave está errada ou o token foi alterado.</AlertDescription>
          </Alert>
          <Alert v-else-if="verification === 'unsupported'" variant="info" role="status">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>Aqui só dá para conferir assinaturas HS256, HS384 e HS512. Este token usa {{ algorithm || 'outro algoritmo' }}.</AlertDescription>
          </Alert>
          <p v-else class="break-all text-sm text-muted-foreground">Assinatura: <span class="text-warning">{{ decoded.parts[2] || '(vazia)' }}</span></p>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
