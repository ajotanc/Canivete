---
name: Canivete
description: Caixa de ferramentas pequenas e precisas; cada ferramenta tem uma cor de cabo, todas guardam o mesmo rigor.
colors:
  primary: "#0E1420"
  primary-foreground: "#F7F8FA"
  background: "#EEF1F4"
  surface: "#FFFFFF"
  foreground: "#0E1420"
  muted: "#E2E7ED"
  muted-foreground: "#55607A"
  border: "#D5DBE3"
  input: "#C3CBD6"
  cobalt: "#2457F5"
  berry: "#C2255C"
  berry-foreground: "#FFFFFF"
  pivot: "#E5322D"
  destructive: "#D92D27"
  success: "#0E7C57"
  warning: "#B45309"
  info: "#2457F5"
  dark-background: "#111823"
  dark-surface: "#18212F"
  dark-foreground: "#E8ECF2"
  dark-muted: "#223044"
  dark-muted-foreground: "#93A0B5"
  dark-border: "#2A384D"
  dark-cobalt: "#7C9BFF"
  dark-berry: "#FF7AA2"
  dark-berry-foreground: "#2A0A14"
  dark-pivot: "#FF5A52"
  dark-destructive: "#F87171"
  dark-input: "#34445C"
typography:
  display:
    fontFamily: "Gabarito Variable, Onest Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Gabarito Variable, Onest Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Gabarito Variable, Onest Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Onest Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Onest Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  2xl: "16px"
  3xl: "24px"
  4xl: "32px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  control: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "8px 20px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "8px 20px"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "44px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "4px 12px"
  tool-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "20px"
  pin-slot:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    size: "44px"
  pin-slot-large:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    size: "56px"
  person-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  page-header-filled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.3xl}"
    padding: "32px"
  fact-tile-glass:
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.xl}"
    padding: "12px"
  fact-tile-paper:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "12px"
  badge-tool:
    textColor: "{colors.primary}"
    rounded: "9999px"
    padding: "2px 8px"
  gift-slot:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    width: "384px"
    padding: "16px"
  gift-slot-frame:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: "12px"
  gift-slot-reel:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.2xl}"
    height: "96px"
  header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "56px"
---

# Design System: Canivete

## Overview

**Creative North Star: "A Caixa de Cabos Coloridos"**

Canivete é um catálogo de ferramentas de precisão, não uma landing. O chão é cinza-aço frio, as superfícies são brancas e a tinta é azul-noite. Cada ferramenta tem uma cor de cabo (cobalto para o sorteador, framboesa para o amigo secreto) que aparece como faixa no card da home e, ao abrir a ferramenta, vira o primário da página inteira: botões, foco, seleção, a faixa sob o cabeçalho e o bloco de abertura da página. O vermelho de pivô existe só no pino da marca e no ícone do app (tinta #0E1420 com pino vermelho; `theme-color` igual).

A densidade é de ferramenta: linhas de 1px, raio generoso e redondo, números tabulares, atalhos de teclado visíveis (Kbd). Profundidade é quase toda tonal e por borda; sombra aparece só em cards da home, cartões de pessoa, miniaturas e na máquina do amigo secreto. O tema claro é o padrão: sem escolha salva o app abre claro, mesmo com o sistema em escuro, e a escolha salva do usuário prevalece (`src/core/theme/useTheme.ts`). O tema escuro é grafite azulado, nunca preto.

**Key Characteristics:**
- Chão cinza-aço, superfície branca, tinta azul-noite; dark em grafite azulado.
- A cor de cabo da ferramenta troca o primário da página (`html[data-tool]`).
- Gabarito nos títulos, Onest no texto, sem monoespaçada.
- Raio-base 1rem: 16px nos controles, 20px nos cards, 24px no bloco de abertura; todo controle tem 44px de altura.
- Busca por Command palette (Ctrl/Cmd K ou "/") e filtros por categoria.
- Toda página abre com o `PageHeader filled` e o ícone da ferramenta num chip: bloco na cor da ferramenta (tinta na home), com `FactTile`s e exatamente um de papel (`paper`).
- A revelação do par é uma máquina caça-níquel na cor da ferramenta: a máquina inteira é o botão, os nomes rolam numa roleta vertical, o nome pousa e o confete dispara (`src/core/effects/confetti.ts`); o nome se esconde sozinho após 15s.
- Movimento curto, sempre com alternativa para `prefers-reduced-motion`.

## Colors

Neutros frios azulados com uma cor saturada por vez: a do cabo da ferramenta em uso.

### Primary
- **Tinta Azul-noite** (`primary`, #0E1420): primário fora de ferramentas (home, 404) e texto principal; é o bloco de abertura da home (a home não define `data-tool`). No dark vira #E8ECF2, e o bloco da home vira uma placa clara. O tema claro é o padrão; o escuro só entra por escolha salva do usuário.
- **Cobalto de Cabo** (`cobalt`, #2457F5): cabo do sorteador. Quando a rota é do sorteador, substitui `--primary`, `--ring` e tinge `--accent` a 12% sobre o fundo. Dark: #7C9BFF.
- **Framboesa de Cabo** (`berry`, #C2255C): cabo do amigo secreto, mesmo mecanismo, com texto branco (`berry-foreground`). Dark: #FF7AA2 com texto #2A0A14. O `data-tool` do módulo é `berry`.

### Tertiary
- **Vermelho de Pivô** (`pivot`, #E5322D): só o pino do logotipo no cabeçalho e no ícone do app. Dark: #FF5A52. `destructive` (#D92D27) é uma cor à parte, para ações e erros.

### Neutral
- **Chão Cinza-aço** (`background`, #EEF1F4): fundo da página. Dark: #111823.
- **Superfície Branca** (`surface`, #FFFFFF): cards, popovers, sidebar. Dark: #18212F.
- **Cinza de Apoio** (`muted`, #E2E7ED): secundário, muted e accent padrão. Dark: #223044.
- **Texto Esmaecido** (`muted-foreground`, #55607A): descrições e metadados. Dark: #93A0B5.
- **Linha** (`border`, #D5DBE3) e **Linha de Campo** (`input`, #C3CBD6): bordas de 1px e contorno de campos. Dark: #2A384D e #34445C.
- Estados (o verde `success` #0E7C57 é semântico e não tem relação com cor de módulo): `success` #0E7C57, `warning` #B45309, `info` #2457F5 (dark: #3FD19B, #FBBF24, #7C9BFF). `destructive` #D92D27 (dark #F87171) nas ações destrutivas e erros. Badges semânticos (success, warning, info, danger) e `tool` usam a cor a 15% de fundo com texto na própria cor; o Sonner usa cores ricas.

### Named Rules
**The Um Papel Rule.** Cada hero tem exatamente um `FactTile` `paper`, o fato-chave da página: branco no tema claro e card escuro sobre a placa clara do hero no dark. Nenhuma outra caixa do hero usa a superfície do card.

**The Cabo Rule.** Cada ferramenta tem exatamente uma cor de cabo; ela serve de primário da página e é usada nas miniaturas, no bloco de abertura e no ponto da paleta de comandos. Ferramenta nova declara `color` no manifest e uma entrada `[data-tool]` em `src/style.css`.

**The Selo do Módulo Rule.** Selo de status dentro de um módulo usa a cor do módulo (`tool`) ou uma cor semântica (success, warning, danger). O `info` cobalto nunca entra no módulo framboesa.

**The Pivô Rule.** O vermelho de pivô fica só no pino da marca. Não vira cor de botão, aviso ou texto. Erros e destruição usam `destructive`, em botões vermelhos.

## Typography

**Display Font:** Gabarito Variable (com Onest Variable, ui-sans-serif, system-ui)
**Body Font:** Onest Variable (com ui-sans-serif, system-ui, sans-serif)

**Character:** Gabarito dá títulos geométricos e firmes; Onest mantém o texto neutro e legível em tela pequena. Ambas são auto-hospedadas via @fontsource-variable. Números tabulares no corpo inteiro.

### Hierarchy
- **Display** (600, 2.25rem a 3rem, 1.05, -0.03em): título da home, `PageHeader size="lg"` (text-4xl, sm:text-5xl).
- **Headline** (600, 1.875rem a 2.25rem): `h1` das ferramentas, vindo do `PageHeader` padrão (text-3xl, sm:text-4xl, leading-tight).
- **Title** (600, 1.25rem): título de card (`h2`).
- **Body** (400, 1rem a 1.125rem): texto e descrições (a descrição do `PageHeader` é text-lg, até `max-w-3xl`), em `muted-foreground` quando secundário.
- **Label** (500, 0.875rem): botões, badges, itens de lista.

### Named Rules
**The Dois Fios Rule.** `h1`, `h2` e `h3` usam Gabarito 600 com `tracking-tight` e `text-balance` por regra global; o resto é Onest.

## Layout

Contêiner de `max-w-6xl` com 16px laterais; cabeçalho fixo de 56px; conteúdo com `py-8` (celular) e `py-12` (sm+). A home empilha título, busca (InputGroup de 44px com Kbd) e filtros (ToggleGroup), depois uma grade de cards: 1 coluna, 2 em sm, 3 em lg, com gap de 20px. Espaçamento em múltiplos de 4px, seções com `space-y-8`. Todo controle tem 44px de altura (h-11) em qualquer largura. No celular, toda grade de fatos do hero tem 2 colunas e o fato `paper` ocupa as duas (`col-span-2`); nos heroes de 3 fatos (home e sorteador) a grade vira 3 colunas a partir de sm e o `paper` volta a uma coluna. Todas as páginas abrem com o `PageHeader filled` (home, sorteador, resultado compartilhado, criar grupo, convite, painel do organizador e Meu par), com `space-y-4` entre a linha de voltar/ações (altura mínima 44px), a linha título + descrição (com o chip do ícone da ferramenta sempre visível: acima do título no celular, em coluna, e ao lado dele a partir de sm) e, abaixo, o conteúdo extra (fatos, selos) em largura total. Telas estreitas (criar grupo, convite do grupo, cartão de login do organizador) ficam centralizadas com `mx-auto` e `max-w-xl`; o painel do organizador e Meu par também usam `mx-auto`, com `max-w-5xl`. O rodapé tem uma linha de apoio e a dica do atalho "/".

## Elevation & Depth

Híbrido, mas de baixo contraste: tonal e por borda de 1px primeiro, sombra suave e azulada (base rgb(14 20 32)) só onde algo se destaca do chão.

### Shadow Vocabulary
- **Card em repouso** (`box-shadow: 0 1px 2px rgb(14 20 32 / 0.06)`): card de ferramenta na home.
- **Card elevado** (`box-shadow: 0 12px 28px -12px rgb(14 20 32 / 0.35)`): hover do card, junto com subida de 2px.
- **Miniatura** (`box-shadow: 0 6px 16px -6px rgb(14 20 32 / 0.45)`): mini-janelas de PreviewRaffle e PreviewSanta sobre a faixa colorida.
- **Máquina** (`box-shadow: 0 22px 44px -20px rgb(14 20 32 / 0.55)`): GiftTag do amigo secreto, direto sobre o fundo da página, sem card em volta.
- **Cartão de pessoa** (`shadow-sm`, hover `shadow-md` com subida de 2px): botões de "Quem é você?" no convite.
- Controles usam `shadow-xs` (padrão shadcn) e anel de foco `ring-3` na cor `ring`.

### Named Rules
**The Chão Plano Rule.** Páginas e seções não têm sombra; ela só aparece em objetos que se levantam (card da home, cartão de pessoa, miniatura e máquina). Sempre sombras difusas, nunca deslocamento duro.

## Shapes

Raio-base de 1rem (`--radius`). Escala: sm 12px, md 14px, lg 16px, xl 20px. Botões, campos, grupo de campo, slots de PIN e NumberField usam `rounded-lg` (16px); Tabs list, cards, Empty e FactTile usam `rounded-xl` (20px); cartões de pessoa, chip do ícone do PageHeader, janela da roleta e slots de PIN grandes usam `rounded-2xl` (16px); o bloco `PageHeader filled` e a moldura branca da máquina usam `rounded-3xl` (24px); o corpo da máquina usa `rounded-[2rem]` (32px); badges são pílula (`rounded-full`) por padrão; a categoria na home e os selos dentro de heroes e painéis usam `rounded-md` (14px). Bordas de 1px na cor `border`, tracejadas só no estado vazio. O logotipo e o ícone do app são um quadrado de raio 7/32 em tinta azul-noite com duas lâminas claras e o pino de pivô.

## Components

### Buttons
- **Shape:** raio de 16px; altura de 44px em todos os tamanhos (default, xs, sm, lg) e ícone 44x44; só o padding lateral muda (16 a 24px). Peso 600.
- **Dentro de grupo de campo:** o botão preenche a altura inteira do grupo, rente à borda direita, com cantos esquerdos retos.
- **Primary:** `primary` com `primary-foreground`; em ferramentas fica na cor do cabo. Desabilitado vira `muted`, sem opacidade.
- **Hover / Focus:** hover a 90%; foco com anel de 3px em `ring` a 50%.
- **Outline / Secondary / Ghost / Link:** outline com borda e fundo da página; secondary em `muted`; ghost só no hover (`accent`); link sublinhado. Destructive em vermelho cheio (`destructive`, texto branco).

### Cards / Containers (card de ferramenta)
- **Corner Style:** 20px, borda 1px, fundo `surface`.
- **Estrutura:** faixa de cabo de 176px de altura (`bg-tool`) com a miniatura da ferramenta, depois bloco de 20px de padding com o ícone da ferramenta num chip de 40px na cor do cabo (`rounded-xl`) ao lado do título (Gabarito 20px), descrição, Badge de categoria e "Abrir" com seta.
- **Hover:** sobe 2px, sombra elevada, seta anda 4px; sem transformação com `prefers-reduced-motion`.

### Inputs / Fields
- **Style:** altura 44px (Input, InputGroup, NumberField, item de ToggleGroup, Tabs list), borda `input`, raio 16px, fundo transparente (30% de `input` no dark).
- **Focus:** borda `ring` e anel de 3px a 50%.
- **Error:** `aria-invalid` troca borda e anel para `destructive`. Desabilitado a 50%.

### Navigation
Cabeçalho de 56px, `bg-background` a 90% com blur, borda inferior. Marca à esquerda; à direita botão outline "Buscar ferramenta" com Kbd (ícone no celular) e alternância de tema. Dentro de uma ferramenta, uma faixa de 4px na cor do cabo fecha o cabeçalho. Link "Ir para o conteúdo" visível ao receber foco.

### Paleta de comandos
Command em diálogo (`CommandPalette.vue`), aberta por Ctrl/Cmd K ou "/" (quando não se digita). Grupos "Ferramentas" (ponto de 24px na cor do cabo, ícone, título, categoria como atalho) e "Ações" (início, tema).

### Diálogos e estados vazios
Dialog e AlertDialog compartilham a mesma caixa: `bg-card` (branca no claro), borda 1px, `rounded-lg` (16px), padding 24px, `shadow-lg`, véu preto a 80%. Todo estado sem conteúdo (lista vazia, não encontrado, erro, carregando falho, 404 e os estados do resultado compartilhado) usa o padrão Empty: ícone em `EmptyMedia`, título, descrição e uma ação, em caixa tracejada `rounded-xl` (20px) com `bg-card/50`; `NotFoundView` é o exemplo.

### PageHeader
Cabeçalho único das páginas (`src/components/PageHeader.vue`): `h1`, descrição, prop `icon` e cinco slots: `back` (canto superior esquerdo, margem -12px para alinhar o botão), `actions` (canto direito), `media` (ilustração opcional, sem uso hoje), `badge` (selo ao lado do título) e o padrão (fatos, selos e avisos), que renderiza abaixo da linha do título, em largura total. `icon` é o ícone da ferramenta num chip de 56px (`rounded-2xl`, ícone de 28px), visível em todas as larguras: a linha do título é `flex-col` no celular (chip acima do título) e `sm:flex-row` a partir de sm (chip ao lado); em `filled` o chip é `primary-foreground` a 15%, sem `filled` é `primary` a 10%. Toda página de ferramenta passa o seu ícone: home Wrench, sorteador e resultado compartilhado Dices, páginas do amigo secreto Gift. `size` é `default` ou `lg` (home). `filled` é o modo de abertura de toda página: bloco `rounded-3xl bg-primary` (24px), padding 24px (32px em sm+), `text-primary-foreground`, descrição a 90%. Na home o primário é tinta e o bloco é tinta (no dark, placa clara); sorteador e resultado compartilhado são cobalto; criar grupo, convite, painel do organizador e Meu par são framboesa. Botões de voltar/ações dentro do bloco ganham hover translúcido (`primary-foreground` a 15%) em vez do hover padrão. Sem `filled`, o cabeçalho fica sobre o chão com descrição em `muted-foreground`.

### FactTile
Bloco de fato do hero (`src/components/FactTile.vue`), usado dentro de um `dl`: ícone de 20px, rótulo xs, valor em 600 (`text-balance`), `rounded-xl` (20px), padding 12px. Os valores são curtos para caber numa linha ("3 passos", "4 números", "Verificável", "2 disponíveis", "Como app"). Tom `glass` (`bg-primary-foreground/15`, rótulo a 90%) para fatos comuns; tom `paper` (`bg-card text-card-foreground shadow-sm`, rótulo `muted-foreground`) para o fato-chave, na linha inteira no celular (`col-span-2`; `sm:col-span-1` nos heroes de 3 fatos). Fato-chave por página: home e sorteador, "Sem cadastro"; criar grupo, "Só você vê o seu par"; convite, painel e Meu par, a data da troca com contagem regressiva (`eventCountdown` e `formatEventDate` em `src/modules/secret-santa/lib/event.ts`: "Troca em 79 dias", "Troca amanhã", "A troca é hoje", "Data da troca" se já passou); resultado compartilhado, "Registro: Não foi alterado depois de criado" (só quando verificado). A interface não promete "sem anúncios" em lugar nenhum.

### Badge
Pílula de 12px com variantes `default`, `secondary`, `outline`, `destructive` e as de estado: `tool` (`bg-primary/15 text-primary`, a cor do módulo), `glass` (`bg-primary-foreground/20`, sobre o hero preenchido), `success`, `warning`, `info` e `danger` (cor a 15% com texto na própria cor).

### Miniaturas de ferramenta
Mini-janelas de 176px desenhadas em código sobre a faixa de cabo: lista de nomes com marca de seleção que desce no hover (sorteador) e, no amigo secreto, um mini campo de PIN de 4 slots que se preenche no hover ou foco do card, sobre o botão "Ver meu par". Cada ferramenta nova traz o seu `preview`.

### Confete e ícone de WhatsApp
Confete: chuva de 2,5s por padrão em canvas fixo (`triggerConfetti`) nas cores #2457F5, #0E7C57, #E5322D, #F2B600 e #FFFFFF; a revelação do par usa 3,5s com framboesa (#C2255C, #FF7AA2), dourado (#F2B600), cobalto e branco. O dourado #F2B600 existe só nessas paletas, como hex fixo em `src/core/effects/confetti.ts` e `MeView.vue`; não é token. Com movimento reduzido caem menos partículas e some em até 1,8s. Núcleo reutilizável. `WhatsappIcon.vue` é o ícone de marca do compartilhamento, em SVG próprio.

### Resultado compartilhado
SharedResultView abre com `PageHeader filled` em cobalto (selo `glass` "Registro verificado" e FactTiles); os estados de carregando, não encontrado e erro usam o padrão Empty (ícone, título, descrição e ação) e mostra cada vencedor na placa primária: `bg-primary`, `text-primary-foreground`, 600, 1.5rem, raio 16px.

### PinField e passo do PIN do convite
PinField: 4 slots por padrão (`length`), mascarados, entrada numérica, alinhados à esquerda por padrão. Tamanho padrão: slots de 44px, raio 16px, gap de 6px. Prop `large`: slots de 56px, `rounded-2xl` (16px), texto 2xl, gap de 12px. Prop `centered` os centraliza; só o card de PIN do convite usa `centered` e `large`. No convite, o passo do PIN é um card (`overflow-hidden`, sem padding próprio) com cabeçalho tingido (`bg-primary/10`): avatar redondo de 80px com a inicial e anel de 8px (`ring-primary/15`), saudação "Olá, {primeiro nome}!" em Gabarito e a instrução; abaixo, em padding de 24px, o formulário com PinField grande centralizado e o botão "Abrir meu amigo secreto" com ícone Gift (lucide). No primeiro acesso há o PIN e a repetição, e o botão vira "Criar PIN e abrir".

### Hero do convite
`GroupView.vue` abre com `PageHeader filled`: nome do grupo, descrição conforme a situação (aberto ou sorteado) e uma grade de `FactTile` (`dl`, 2 colunas desde o celular, gap 12px): participantes e valor sugerido em `glass`, a data da troca em `paper` na linha inteira, com contagem regressiva e data por extenso. O painel do organizador segue o mesmo molde; sem data, o `paper` vai para o estado do sorteio. Meu par repete o hero nos dois estados (par revelável e "Tudo certo").

### Quem é você? (convite)
Passo 1 do convite: grade de cartões de pessoa, 1 coluna no celular e 2 em sm+, gap de 12px. Cada cartão é um botão `rounded-2xl` (16px) com borda, fundo `card`, padding 12px, `shadow-sm` (hover `shadow-md` e subida de 2px, sem movimento com `prefers-reduced-motion`), avatar redondo de 48px na cor primária com a inicial, nome em 600 e a linha "Entrar com o PIN" (já tem PIN) ou "Criar o PIN", e seta à direita.

### GiftTag (máquina caça-níquel)
Máquina do amigo secreto (`GiftTag.vue`), `max-w-sm`, corpo `rounded-[2rem]` (32px) na cor da ferramenta (`bg-primary`, texto `primary-foreground`), padding 16px e a sombra Máquina, direto sobre o fundo da página, sem card em volta. De cima para baixo: fileira de 7 luzes (bolinhas de 10px, `primary-foreground` a 70%) que pulsam até o nome pousar; moldura branca interna (`bg-card`, `rounded-3xl`, anel de 4px em `primary-foreground` a 25%, padding 12px) com "Você tirou" e a janela da roleta (96px de altura, `rounded-2xl`, `bg-muted`, esmaecida em cima e embaixo) que mostra "Toque para girar" pulsando, com ícone Pointer. A máquina inteira é o botão (sem botão de revelar nem de esconder); hover sobe 4px. Não há nome do grupo dentro dela: o nome do grupo é só o título da página, para não repetir. Ao tocar, 26 nomes embaralhados e depois o sorteado rolam na vertical por 3,5s com curva `cubic-bezier(0.12, 0.8, 0.2, 1)` (ease-out forte); o nome pousa em Gabarito 30px (`foreground`, os de passagem em `muted-foreground`) e o confete dispara. O nome se esconde sozinho após 15s (`useReveal`). A roleta roda também com movimento reduzido (é iniciada pelo usuário e só rola texto); desligam-se o hover e o pulso das luzes. A lista de desejos e o painel de perguntas seguem o pouso.

## Do's and Don'ts

### Do:
- **Do** colocar uma ferramenta nova sob a Cabo Rule: `color` no manifest, entrada `[data-tool]` e `preview` próprio.
- **Do** usar tokens (`bg-primary`, `text-muted-foreground`, `border-border`) em vez de hex nas telas.
- **Do** manter 44px de alvo de toque no celular e anel de foco visível em todo controle.
- **Do** usar Gabarito só em `h1`-`h3` e Onest no resto, com números tabulares.
- **Do** abrir toda página nova com `PageHeader filled` e `FactTile`s, com exatamente um `tone="paper"`, em vez de `h1` solto.
- **Do** usar `Badge` `tool` ou semântico para status dentro de um módulo.
- **Do** oferecer alternativa para `prefers-reduced-motion` em toda transição ou rotação; efeito que só troca texto (roleta) pode continuar.
- **Do** usar easing ease-out expo `cubic-bezier(0.16, 1, 0.3, 1)` em subidas e entradas, e ease-out forte `cubic-bezier(0.12, 0.8, 0.2, 1)` na roleta, sem bounce.
- **Do** passar o ícone da ferramenta ao `PageHeader` (`icon`) e manter os valores dos `FactTile` curtos, de uma linha.
- **Do** manter o tema claro como padrão; o escuro só por escolha salva.
- **Do** mostrar atalhos com Kbd quando existirem.

### Don't:
- **Don't** usar vermelho de pivô fora do pino da marca, nem o dourado #F2B600 fora das paletas de confete.
- **Don't** usar o selo `info` cobalto dentro do módulo framboesa.
- **Don't** usar fonte monoespaçada nem outra família de título.
- **Don't** sombra fora dos objetos listados em Elevation & Depth.
- **Don't** ícone em quadradinho cinza no estilo de cartão de SaaS; o chip do ícone é sempre na cor da ferramenta (cabo ou `primary`).
- **Don't** preto puro no dark; o chão é #111823.
