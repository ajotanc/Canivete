# Canivete: design

Data: 2026-10-05

## 1. Objetivo

O Canivete é um hub público de ferramentas utilitárias, sem login. Cada ferramenta é um módulo independente que se encaixa numa plataforma genérica. O primeiro módulo é um sorteador de nomes online.

Critério de sucesso: adicionar uma nova ferramenta exige apenas criar uma pasta em `src/modules/`, sem editar código do núcleo.

## 2. Convenções

- **Em inglês:** pastas, arquivos, variáveis, funções, classes, tipos, rotas e chaves de dados.
- **Em português (pt-BR):** textos da interface, mensagens, comentários e blocos de documentação (JSDoc) de funções.
- **Estilo:** 100% Tailwind CSS v4 em classes utilitárias. `style` inline só para valores realmente dinâmicos (por exemplo, o deslocamento de uma animação). Sem `<style>` nos componentes. CSS próprio apenas nas variáveis de tema (`@theme`) exigidas pelo shadcn-vue.
- **Componentes de UI:** shadcn-vue, copiados para `src/components/ui/`.
- **Ícones:** `@lucide/vue`. Os componentes gerados pelo shadcn-vue que importarem `lucide-vue-next` têm o import trocado para `@lucide/vue`.
- **Vue:** Composition API com `<script setup lang="ts">`.
- **Idioma do site:** apenas português, sem i18n.

## 3. Stack

Vue 3, Vite, TypeScript, Vue Router, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn-vue (Reka UI), `@lucide/vue`, Appwrite (SDK Web), Vitest para testes.

O Appwrite é carregado sob demanda: só módulos que declaram `usesBackend: true` o utilizam, e o SDK só entra no bundle desses módulos.

## 4. Arquitetura da plataforma

Abordagem de **registro de módulos em pasta**.

```
src/
  core/
    layout/              shell, cabeçalho, rodapé
    home/                HomeView com cards, busca e filtro por categoria
    modules/             loader e tipos do contrato de módulo
    theme/               tema claro/escuro
    services/appwrite.ts cliente Appwrite, inicializado só quando pedido
    router.ts
  components/ui/         shadcn-vue
  modules/
    raffle/              primeiro módulo (seção 5)
```

### 4.1 Contrato do módulo

Cada módulo expõe `manifest.ts` com default export do tipo `ToolManifest`:

```ts
interface ToolManifest {
  id: string               // slug único, usado na rota (ex.: 'raffle')
  title: string            // texto exibido (pt-BR)
  description: string      // texto exibido (pt-BR)
  icon: Component          // componente de @lucide/vue
  category: string         // usado no filtro da home
  usesBackend: boolean     // true se depende do Appwrite
  routes: RouteRecordRaw[] // rotas do módulo, com componentes lazy
}
```

### 4.2 Descoberta

O loader usa `import.meta.glob('/src/modules/*/manifest.ts', { eager: true })` para ler os manifests. A home, a busca e o router são gerados a partir deles. Os componentes das rotas são importados com `() => import(...)`, o que gera code-splitting por módulo.

### 4.3 Regras de dependência

- Um módulo depende do `core` e de `components/ui` apenas pelo contrato.
- Um módulo nunca importa de outro módulo.
- O `core` nunca importa de um módulo específico.

### 4.4 Home

Grid de cards (ícone, título, descrição), campo de busca por título e descrição, filtro por categoria. Estado vazio com mensagem em português quando a busca não encontra nada.

### 4.5 Appwrite

`core/services/appwrite.ts` exporta uma função `getAppwrite()` que cria o cliente na primeira chamada (lazy), lendo `VITE_APPWRITE_ENDPOINT` e `VITE_APPWRITE_PROJECT_ID`. Se as variáveis faltarem, lança um erro com mensagem clara em português, e o módulo que a usa exibe um aviso em vez de quebrar.

## 5. Módulo `raffle` (sorteador de nomes)

```
src/modules/raffle/
  manifest.ts
  RaffleView.vue           rota /raffle
  SharedResultView.vue     rota pública /raffle/r/:id
  lib/draw.ts              sorteio puro
  lib/verify.ts            hash e verificação
  lib/share.ts             gravar/ler resultado no Appwrite
  composables/useRaffle.ts estado e ações da tela
  components/              NameList, DrawAnimation, DrawHistory
```

### 5.1 Entrada de nomes

Campo de texto, um nome por linha. Normalização: `trim` em cada linha e remoção de linhas vazias. Nomes duplicados são sinalizados na interface, não removidos em silêncio. Limite de 1.000 nomes e de 100 caracteres por nome; ao exceder, mostra mensagem em português e bloqueia o sorteio.

### 5.2 Sorteio (`lib/draw.ts`)

- Função pura `drawWinners(participants, count, randomSource)`. Embaralhamento Fisher-Yates com `crypto.getRandomValues` (índice sem viés, via rejeição), retornando os `count` primeiros.
- `count` deve estar entre 1 e o número de participantes. Valores inválidos retornam erro tipado.
- A fonte de aleatoriedade é injetável, para tornar os testes determinísticos.

### 5.3 Opções

- Quantidade de vencedores (N).
- Sem repetição: remove os sorteados da lista para os próximos sorteios.
- Histórico da sessão: lista de rodadas (data, vencedores). Fica em memória; ao recarregar a página, é perdido.

### 5.4 Animação

Apenas apresentação. O resultado já está definido antes de a animação começar, que só o revela (nomes embaralhando e destaque do vencedor). Respeita `prefers-reduced-motion`: nesse caso, revela o resultado direto. Estilo em Tailwind (`animate-*`, `transition-*`).

### 5.5 Link compartilhável e verificação

Fluxo:

1. A usuária sorteia no navegador e clica em "Gerar link".
2. `share.ts` calcula `hash = SHA-256(canonicalJson({ participants, winners, drawnAt }))` e grava um documento no Appwrite.
3. A rota `/raffle/r/:id` lê o documento, recalcula o hash no navegador e exibe "Verificado" se for igual ao gravado, ou um aviso de divergência se não for.

Coleção `raffles` no Appwrite:

| Atributo | Tipo | Observação |
|---|---|---|
| `participants` | string[] | até 1.000 itens de até 100 caracteres |
| `winners` | string[] | subconjunto de `participants` |
| `drawnAt` | datetime | momento do sorteio (ISO 8601) |
| `hash` | string | SHA-256 hexadecimal, 64 caracteres |

Permissões: leitura para `any`, criação para `any`, **sem update nem delete**. O documento é imutável depois de criado.

Serialização canônica: JSON com chaves em ordem fixa e arrays na ordem original, para que o hash seja reproduzível.

**O que a verificação prova:** que o registro não foi alterado depois de criado. **O que não prova:** que o sorteio foi justo, pois quem sorteia é o navegador de quem criou. Sorteio no servidor está fora do escopo. A página de resultado deve deixar essa limitação clara em linguagem simples.

Links são permanentes. Risco aceito na v1: como a criação é pública, a coleção pode receber spam; mitigação por limites de tamanho. Rate limit fica para depois, se virar problema.

## 6. Tratamento de erros

- Falha de rede ou do Appwrite ao gerar o link: mensagem em português (toast) e o sorteio continua disponível localmente.
- Documento inexistente em `/raffle/r/:id`: tela "Sorteio não encontrado".
- Hash divergente: aviso destacado de que o registro não confere.
- Rota desconhecida: página 404 do `core`.
- Todas as mensagens ao usuário em português; erros tipados internos com nomes em inglês.

## 7. Testes

- **Vitest, unitário:** `draw.ts` (distribuição com fonte injetada, limites de `count`, sem repetição), `verify.ts` (hash estável, detecção de adulteração), normalização de nomes, loader de módulos (manifests válidos, ids únicos).
- **Componentes:** `NameList` (duplicados, limites) e `useRaffle` (fluxo sortear, sem repetição, histórico).
- **Appwrite:** `share.ts` testado com o cliente mockado; sem testes de integração contra um projeto real na v1.
- Verificação manual no navegador do fluxo completo, incluindo `prefers-reduced-motion`.

## 8. Fora de escopo (v1)

Login e contas, i18n, sorteio no servidor, rate limit, expiração de links, outros módulos além do `raffle`, PWA.
