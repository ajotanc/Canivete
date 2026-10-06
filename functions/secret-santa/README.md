# Function `secret-santa` (amigo secreto)

Appwrite Function em Node 22 + TypeScript. É a única porta de entrada do módulo de amigo secreto: as tabelas não têm permissão para ninguém e só a Function lê e grava nelas.

## Tabelas

As duas ficam no mesmo banco do sorteador. Nenhuma tem permissões (nem para `any`), e a segurança por linha fica desligada.

### `santa_groups`

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `name` | string | 80 | sim |
| `budget` | string | 40 | não |
| `eventDate` | string | 10 | não |
| `organizerTokenHash` | string | 64 | sim |
| `status` | string | 10 | sim |
| `createdAt` | datetime | | não |

### `santa_participants`

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `groupId` | string | 36 | sim |
| `name` | string | 60 | sim |
| `nameKey` | string | 60 | sim |
| `wishlist` | string | 500 | não |
| `pinHash` | string | 200 | não (padrão vazio) |
| `failedAttempts` | integer | | sim |
| `lockedUntil` | datetime | | não |
| `assignedToId` | string | 36 | não |
| `isOrganizer` | boolean | | sim |

Índices: `idx_group` (key) em `groupId`; `uniq_group_name` (unique) em `groupId` + `nameKey`.

O `pinHash` fica vazio até a pessoa fazer o primeiro acesso. Só um valor que começa com `scrypt$` conta como PIN criado, porque a CLI do Appwrite não consegue gravar `null` como padrão (ela grava o texto "null").

As colunas de texto são `string`, porque o servidor (1.8.1) não tem a rota de `varchar`. As colunas obrigatórias não têm valor padrão, porque o Appwrite não aceita padrão em coluna obrigatória. O código sempre grava `failedAttempts` e `isOrganizer`.

## Function

- Id `secret-santa`, runtime `node-22`, timeout de 15 segundos.
- Permissão de execução: `any`.
- Entrypoint `dist/main.js`, com os comandos de build `npm install && npm run build`.
- Escopos da chave gerada por execução: `databases.read`, `databases.write`, `tables.read`, `tables.write`, `rows.read`, `rows.write`.

### Variáveis

| Variável | Obrigatória | Valor |
|---|---|---|
| `SANTA_DATABASE_ID` | sim | id do banco do sorteador |
| `SANTA_GROUPS_TABLE_ID` | não | padrão `santa_groups` |
| `SANTA_PARTICIPANTS_TABLE_ID` | não | padrão `santa_participants` |
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

O site chama a Function pelo id, configurado em `VITE_APPWRITE_SANTA_FUNCTION_ID=secret-santa`.
