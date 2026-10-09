# Function `secret-santa` (amigo secreto)

Appwrite Function em Node 22 + TypeScript. É a única porta de entrada do módulo de amigo secreto: as tabelas não têm permissão para ninguém e só a Function lê e grava nelas. O bucket das capas só libera leitura; quem grava e apaga é a Function.

## Tabelas

As quatro ficam no mesmo banco do sorteador. Nenhuma tem permissões (nem para `any`), e a segurança por linha fica desligada.

### `santa_groups`

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `name` | string | 80 | sim |
| `budget` | float | | não (padrão `null`) |
| `eventDate` | string | 10 | não |
| `status` | string | 10 | sim (`open`, `drawing` ou `drawn`) |
| `ownerId` | string | 36 | sim |
| `slug` | string | 40 | não (padrão `null`) |
| `exclusions` | string, **array** | 80 por item (`"idA|idB"`, em ordem) | não (padrão `null`) |
| `color` | string | 20 | não (padrão `null`, vale framboesa; nome da paleta ou `#rrggbb`) |
| `cover` | string | 36 | não (padrão `null`; id do arquivo da imagem de capa no bucket `santa_covers`) |

Índice: `idx_owner` (key) em `ownerId`. O `slug` não tem índice único: vários grupos podem repetir o texto do link. A data de criação não tem coluna própria: use o `$createdAt` que o Appwrite já guarda em toda linha.

`ownerId` é o id da conta (Appwrite Auth, e-mail e senha) do organizador que criou o grupo. Só ele administra o grupo e a lista "meus grupos" vem dele; a Function lê o id no cabeçalho `x-appwrite-user-id`. O id do grupo é um código curto aleatório (6 caracteres, ex.: `k7x2m9`). `slug` é o texto opcional e repetível do link (`/secret-santa/g/k7x2m9/familia-da-bagunca`); quem identifica o grupo é o id. `deleteGroup` apaga o grupo com participantes, perguntas, recados e a imagem de capa.

### `santa_participants`

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `groupId` | string | 36 | sim |
| `name` | string | 60 | sim |
| `nameKey` | string | 60 | sim |
| `wishlist` | string, **array** | 620 por item (texto de até 100, mais o link de até 500) | não (padrão `null`) |
| `pinHash` | string | 200 | não (padrão `null`) |
| `failedAttempts` | integer | | sim |
| `lockedUntil` | datetime | | não |
| `assignedToId` | string | 36 | não |
| `isOrganizer` | boolean | | sim |
| `revealed` | boolean | | não (padrão `false`) |

Índices: `idx_group` (key) em `groupId`; `uniq_group_name` (unique) em `groupId` + `nameKey`.

### `santa_questions` (perguntas anônimas)

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `groupId` | string | 36 | sim |
| `fromId` | string | 36 | sim |
| `toId` | string | 36 | sim |
| `question` | string | 200 | sim |
| `answer` | string | 300 | não (padrão `null`) |

Índices: `idx_q_from` (key) em `groupId` + `fromId`; `idx_q_to` (key) em `groupId` + `toId`. A pergunta vai para `toId` (a pessoa que `fromId` tirou) e a Function nunca devolve `fromId` a quem recebe; a resposta só volta para quem perguntou.

### `santa_posts` (mural do grupo)

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `groupId` | string | 36 | sim |
| `authorId` | string | 36 | sim |
| `text` | string | 300 | sim |

Índice: `idx_post_group` (key) em `groupId`. A ordem usa o `$createdAt` do Appwrite.

Não dá para trocar o tipo de uma coluna que já existe: se `budget` era string e `wishlist` era string simples, apague as duas colunas e crie de novo com o tipo da tabela (os dados dessas colunas se perdem).

O `pinHash` e a `wishlist` ficam `null` até a pessoa fazer o primeiro acesso e escrever a lista. Só um valor que começa com `scrypt$` conta como PIN criado; isso protege caso a CLI do Appwrite grave o texto "null" como padrão.

As colunas de texto são `string`, porque o servidor (1.8.1) não tem a rota de `varchar`. As colunas obrigatórias não têm valor padrão, porque o Appwrite não aceita padrão em coluna obrigatória. O código sempre grava `failedAttempts` e `isOrganizer`.

## Bucket `santa_covers` (imagem de capa)

Guarda a imagem que o organizador põe atrás do cabeçalho do grupo. O navegador converte a foto para WebP (até 1600 x 1000) antes de enviar; a Function confere que é um WebP inteiro de até 1,5 MB (`LIMITS.coverBytes`), grava no bucket e só então troca a coluna `cover` do grupo. Quando o organizador troca ou tira a imagem, ou exclui o grupo, o arquivo antigo sai do bucket.

| Ajuste | Valor |
|---|---|
| Id | `santa_covers` |
| Permissões | só **Read** para `any` (qualquer pessoa vê a capa pelo link); ninguém tem Create, Update ou Delete: só a Function grava |
| Segurança por arquivo | desligada |
| Tamanho máximo | 2 MB |
| Extensões permitidas | `webp` |
| Compressão e criptografia | desligadas (o WebP já vem comprimido) |

## Function

- Id `secret-santa`, runtime `node-22`, timeout de 15 segundos.
- Permissão de execução: `any` (os participantes entram sem conta, só com nome e PIN). O organizador usa conta e senha do *Auth* do Appwrite (e-mail/senha ativado); cadastre o domínio do site como plataforma Web. A Function só aceita `createGroup` e as ações de administração com o cabeçalho `x-appwrite-user-id` do dono.
- Entrypoint `dist/main.js`, com os comandos de build `npm install && npm run build`.
- Escopos da chave gerada por execução: `databases.read`, `databases.write`, `tables.read`, `tables.write`, `rows.read`, `rows.write`, `files.read`, `files.write` (os dois últimos são da imagem de capa).

### Variáveis

Os nomes das variáveis, os ids padrão das tabelas, os cabeçalhos, os limites de texto, o bloqueio por PIN errado e as demais regras ficam num arquivo só: `src/config.ts`. Para mudar um limite ou um nome, edite lá; os limites também aparecem no site em `src/modules/secret-santa/constants.ts`, e um teste confere que os dois continuam iguais.

| Variável | Obrigatória | Valor |
|---|---|---|
| `SANTA_DATABASE_ID` | sim | id do banco do sorteador |
| `SANTA_GROUPS_TABLE_ID` | não | padrão `santa_groups` |
| `SANTA_PARTICIPANTS_TABLE_ID` | não | padrão `santa_participants` |
| `SANTA_QUESTIONS_TABLE_ID` | não | padrão `santa_questions` |
| `SANTA_POSTS_TABLE_ID` | não | padrão `santa_posts` |
| `SANTA_COVERS_BUCKET_ID` | não | padrão `santa_covers` |
| `APPWRITE_API_KEY` | não | veja abaixo |

A Function usa a chave temporária que a Appwrite gera a cada execução (cabeçalho `x-appwrite-key`), limitada aos escopos acima. Por isso não é preciso criar nem guardar uma chave de API. Se `APPWRITE_API_KEY` for definida, ela tem prioridade; nesse caso, use uma chave só com os escopos de banco. Endpoint e projeto vêm das variáveis que a Appwrite injeta (`APPWRITE_FUNCTION_API_ENDPOINT` e `APPWRITE_FUNCTION_PROJECT_ID`).

## Publicar

Com a CLI do Appwrite autenticada e apontada para o projeto (`appwrite client --project-id <id>`), empacote o código-fonte (sem `node_modules` nem `dist`) e publique:

```bash
cd functions/secret-santa
tar --force-local -czf ../secret-santa.tar.gz package.json package-lock.json tsconfig.json src
cd ../..
npx appwrite functions create-deployment --function-id secret-santa \
  --code functions/secret-santa.tar.gz --activate true \
  --entrypoint dist/main.js --commands "npm install && npm run build"
rm functions/secret-santa.tar.gz
```

O deployment precisa chegar ao estado `ready`. Se o build falhar, os logs aparecem em `appwrite functions get-deployment`.

## Front-end

O site chama a Function pelo id `secret-santa` e lê as capas do bucket `santa_covers`; os dois ids estão em `APPWRITE_IDS`, em `src/core/config.ts` (não há variável de ambiente para eles).
