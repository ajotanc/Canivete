# Amigo secreto: design

Data: 2026-10-06. Segundo módulo do Canivete (`secret-santa`), ao lado do sorteador (`raffle`). Complementa `2026-10-05-canivete-design.md`; as convenções de lá valem aqui.

## 1. Objetivo

Organizar um amigo secreto online: o organizador cria o grupo e convida as pessoas por um link; cada pessoa entra com nome, lista de desejos e um PIN; o organizador sorteia; cada pessoa volta, informa nome e PIN e vê **somente** quem tirou e a lista de desejos dessa pessoa. Ninguém vê os pares dos outros, nem o organizador.

Critério de sucesso: nenhuma ação do navegador devolve pares que não sejam do próprio solicitante, e o fluxo inteiro funciona bem num celular aberto a partir de um link do WhatsApp.

Referência de produto: o fluxo do site drawnames.com.br (convite, lista de desejos, sorteio).

## 2. Escopo da v1

Dentro: criar grupo (nome, valor sugerido e data opcionais), organizador participa (opcional), convite por link, entrar com nome, desejos e PIN, editar desejos, painel do organizador (ver nomes, remover participante, sortear), revelar quem tirou.

Fora: exclusões (quem não pode tirar quem), e-mail e notificações, reaproveitar grupo no ano seguinte, apagar grupo pela interface, expiração automática de grupos, login com conta.

## 3. Arquitetura

**A Function é a única porta de entrada.** As tabelas ficam fechadas ao público (sem permissão para `any`). O navegador chama uma Appwrite Function (`secret-santa`) por `Functions.createExecution` e nunca lê nem grava tabelas. A Function usa a chave de servidor para acessar o banco.

```
Navegador (Vue) ──createExecution──▶ Function secret-santa (Node) ──chave de servidor──▶ TablesDB
      │                                   ├─ lib/ (lógica pura: sorteio, validação, hash de PIN)
      └─ src/modules/secret-santa/        └─ handler (ações, erros)
```

Código:
- `functions/secret-santa/src/`: handler e `lib/` (draw, pin, validate, tokens, errors).
- `src/modules/secret-santa/`: telas, composables e o cliente fino (`api.ts`) que chama a Function. Nada é importado de `raffle` nem do `core` além do contrato.
- Testes em `tests/` (centralizados): `tests/functions/secret-santa/` e `tests/modules/secret-santa/`.

Execução: a Function tem permissão de execução para `any`. Runtime Node. Corpo JSON `{ action, ...params }`; resposta JSON `{ ok: true, data }` ou `{ ok: false, error: { code, message } }` (mensagem em português).

## 4. Dados (tabelas fechadas)

`groups`: `name` (string 80), `budget` (string 40, opcional), `eventDate` (string, ISO `YYYY-MM-DD`, opcional), `organizerTokenHash` (string 64), `status` (`open` | `drawing` | `drawn`), `createdAt` (datetime).

`participants`: `groupId` (string 36), `name` (string 60), `nameKey` (string 60, nome normalizado: NFC, `trim`, minúsculas pt-BR, único dentro do grupo), `wishlist` (string 500), `pinHash` (string 200, scrypt com sal por linha), `failedAttempts` (integer), `lockedUntil` (datetime, opcional), `assignedToId` (string 36, opcional), `isOrganizer` (boolean).

`drawnAt` e outros datetimes são gravados em ISO com `Z`; a leitura normaliza com `new Date(x).toISOString()` (o Appwrite devolve `+00:00`).

## 5. Contrato da Function

| Ação | Autenticação | Entrada | Resposta |
|---|---|---|---|
| `createGroup` | nenhuma | `name`, `budget?`, `eventDate?`, `organizer?: { name, pin, wishlist? }` | `groupId`, `adminToken` (exibido uma vez) |
| `getGroup` | nenhuma | `groupId` | `name`, `budget`, `eventDate`, `status`, `participantCount` |
| `join` | nenhuma | `groupId`, `name`, `pin`, `wishlist?` | `ok`; recusa grupo que não está `open` e nome repetido |
| `updateWishlist` | nome + PIN | `groupId`, `name`, `pin`, `wishlist` | `ok`; recusa depois do sorteio |
| `listParticipants` | token do organizador | `groupId`, `adminToken` | só os nomes e se participam; nunca pares |
| `removeParticipant` | token do organizador | `groupId`, `adminToken`, `name` | `ok`; só com grupo `open` |
| `draw` | token do organizador | `groupId`, `adminToken` | `ok`; exige grupo `open` e 3 ou mais participantes |
| `reveal` | nome + PIN | `groupId`, `name`, `pin` | antes do sorteio: `status: 'open'` e a própria lista; depois: `status: 'drawn'` e `receiver: { name, wishlist }` |

Limites: grupo com até 100 participantes; nome do grupo até 80 caracteres; nome de pessoa até 60; desejos até 500; PIN com 4 a 6 dígitos.

Códigos de erro: `INVALID_INPUT`, `GROUP_NOT_FOUND`, `GROUP_CLOSED`, `NAME_TAKEN`, `BAD_CREDENTIALS`, `LOCKED`, `NOT_ENOUGH_PARTICIPANTS`, `FORBIDDEN`, `INTERNAL`.

## 6. Segurança

- **PIN:** guardado com `scrypt` (`node:crypto`) e sal por participante; comparação em tempo constante.
- **Bloqueio:** 5 PINs errados bloqueiam o participante por 15 minutos (`failedAttempts`, `lockedUntil`); acerto zera o contador.
- **Erro genérico:** nome inexistente e PIN errado respondem o mesmo `BAD_CREDENTIALS`, para não revelar quem está no grupo. O bloqueio só é verificado depois de achar o nome, e responde `LOCKED` apenas para um nome que existe.
- **Token do organizador:** 32 bytes aleatórios, em base64url; só o hash SHA-256 fica no banco. O link de administração leva o token no fragmento (`#t=...`), que não vai para logs de servidor. O token é guardado no `localStorage` do organizador e o front mostra um aviso para ele salvar o link.
- **Nada de pares no navegador:** `reveal` devolve apenas o par do próprio solicitante; `listParticipants` não inclui `assignedToId`.
- **Permissões:** tabelas sem permissão para `any`; a chave de API da Function tem só os escopos de banco de dados necessários.
- **Limitação aceita:** o PIN de 4 dígitos com bloqueio resiste a tentativas casuais, não a um ataque distribuído. Quem tem acesso de administrador ao projeto Appwrite consegue ler as tabelas. O organizador pode ler os desejos por ter acesso ao banco, mas a interface não os mostra.

## 7. Sorteio

`lib/draw.ts`, função pura `assignSecretFriends(ids: string[], randomInt): Map<string, string>`:

1. Exige 3 ou mais ids, senão erro `NOT_ENOUGH_PARTICIPANTS`.
2. Embaralha os ids (Fisher-Yates com `crypto.getRandomValues` e rejeição, como no sorteador) e liga cada um ao seguinte, o último ao primeiro: uma roda única. Ninguém tira a si mesmo.

Execução do `draw`: valida o token, passa o grupo de `open` para `drawing` (bloqueia novas entradas), grava `assignedToId` de todos, passa para `drawn`. Se algo falhar no meio, volta para `open` e o organizador pode tentar de novo; `reveal` só revela com o grupo em `drawn`.

## 8. Front-end

Rotas do módulo (todas com prefixo `/secret-santa`):

| Rota | Tela |
|---|---|
| `/secret-santa` | Criar grupo (3 passos) |
| `/secret-santa/g/:id` | Convite: dados do grupo, entrar e "Já entrei" |
| `/secret-santa/g/:id/me` | Meu painel: desejos, e a revelação depois do sorteio |
| `/secret-santa/g/:id/admin` | Painel do organizador (token em `#t=`) |

O manifest tem `usesBackend: true`, categoria `Sorteios`, ícone `Gift` de `@lucide/vue`.

Estado de sessão: nome e PIN ficam só em memória e em `sessionStorage` durante a visita, para não pedir de novo ao recarregar; o PIN nunca vai para `localStorage` nem para a URL.

## 9. Design (definido com ui-ux-pro-max e frontend-design)

**Padrão:** funil em passos (do ui-ux-pro-max), com revelação progressiva. Estilo bloco vibrante, mas contido: a paleta do Canivete é o briefing e prevalece sobre a sugestão de vermelho e dourado do gerador.

**Cores** (tokens do hub): `#E3F2FD` fundo; `#1E293B` texto; `#1D4ED8` ação principal e etiqueta; `#3B82F6` detalhes, foco e barbante; `#FFFFFF` campos e superfícies. No tema escuro, `#1E293B` fundo e `#E3F2FD` texto. Contraste de texto de pelo menos 4,5:1.

**Tipografia:** Nunito 800 nos títulos do módulo (arredondada, de brincadeira); corpo em Inter, como no hub. Corpo com 16px, linhas de até 70 caracteres, escala de títulos 28/22/18.

**Layout:** uma coluna no celular (375px), largura máxima de 28rem centralizada em telas maiores. Formulários alinhados à esquerda, rótulo visível acima de cada campo, erro junto do campo, ajuda embaixo. Alvos de toque de pelo menos 44px, espaçamento generoso. Sem grade de cartões iguais: cada tela é um fluxo único. Passos numerados só na criação do grupo, porque ali existe sequência.

```
Criar grupo (passo 1 de 3)        Revelação
┌──────────────────────────┐      ┌──────────────────────────┐
│ Nome do grupo            │      │ Você tirou                │
│ [______________________] │      │        ○  (furo)          │
│ Valor sugerido (opcional)│      │   ┌──────────────────┐    │
│ [______________________] │      │   │  (etiqueta azul)  │    │
│          [ Continuar ]   │      │   └──────────────────┘    │
└──────────────────────────┘      │   [ Revelar ]  15 s       │
                                  └──────────────────────────┘
```

**Elemento memorável:** a etiqueta de presente da revelação. Fica fechada (verso liso, furo e barbante em `#3B82F6`) até o toque em "Revelar", quando vira (200 a 300 ms) e mostra o nome em Nunito 800; some sozinha em 15 segundos e há o botão "Esconder". Sem movimento (`prefers-reduced-motion`), o nome só aparece e some. Nenhum outro movimento decorativo; só os que respondem a uma ação (confirmar, copiar, entrar).

**Textos (pt-BR, voz direta):** botões dizem a ação ("Criar grupo", "Entrar no grupo", "Sortear", "Revelar"); o mesmo nome acompanha o fluxo todo (o botão "Sortear" gera o aviso "Sorteio feito"). Erros dizem o que houve e o que fazer, sem pedir desculpas. Estados vazios convidam à ação ("Ninguém entrou ainda. Envie o convite.").

**Acessibilidade:** foco visível, navegação por teclado, rótulos em todos os campos, o PIN com `inputmode="numeric"` e `autocomplete="off"`, a etiqueta com `aria-live="polite"`, confirmação antes do sorteio (ação irreversível) em diálogo do shadcn-vue.

**Componentes:** shadcn-vue (`button`, `card`, `input`, `textarea`, `label`, `dialog`, `badge`, `sonner`), compostos como em `Card`/`CardHeader`/`CardContent`, importados individualmente. Ícones só de `@lucide/vue`, sem emoji. Estilo 100% Tailwind, `style` inline só para o valor dinâmico da animação.

**Convite por WhatsApp:** botão que abre `https://wa.me/?text=` com o nome do grupo e o link, mais um botão de copiar.

## 10. Erros e estados

Cada erro da Function vira uma mensagem em português perto do campo ou em toast. Rede fora do ar: "Não foi possível falar com o servidor. Tente novamente." Grupo inexistente: tela "Grupo não encontrado". Grupo já sorteado ao entrar: "Este grupo já foi sorteado." PIN bloqueado: "Muitas tentativas. Tente de novo em N minutos." Function não configurada (variáveis ausentes): aviso claro, sem página em branco.

## 11. Testes (Vitest, em `tests/`)

- `assignSecretFriends`: sem pares consigo mesmo, todos recebem e dão exatamente um, forma de roda única, mínimo de 3, fonte aleatória injetável.
- `pin`: hash e verificação, sal diferente por hash, PIN inválido rejeitado.
- `tokens`: geração aleatória, hash estável, comparação em tempo constante.
- `validate`: limites, normalização de `nameKey` (acentos, maiúsculas, espaços), duplicados.
- Handler com banco falso em memória: cada ação (sucesso e erro), bloqueio após 5 falhas, `BAD_CREDENTIALS` igual para nome inexistente e PIN errado, `reveal` nunca devolve o par de outra pessoa, `listParticipants` sem `assignedToId`, `draw` com falha no meio volta para `open`, entrada recusada em `drawing`/`drawn`.
- Front: `api.ts` (mapeia respostas e erros), composable de revelação (auto-esconder, movimento reduzido), componentes de formulário.
- Verificação manual no navegador, a 375px e em desktop, em tema claro e escuro e com movimento reduzido.

## 12. Publicação

A Function é criada e publicada no projeto Appwrite existente (pelo MCP do Appwrite ou pela CLI), com as tabelas `groups` e `participants` criadas antes. Variáveis da Function: endpoint, projeto, chave de servidor com escopo mínimo, ids do banco e das tabelas. Variáveis do front: `VITE_APPWRITE_SANTA_FUNCTION_ID`. O README documenta a configuração.

## 13. Decisão pendente

O que fazer com o sorteador atual (`raffle`) é decidido depois, a pedido da usuária; esta spec não o altera.
