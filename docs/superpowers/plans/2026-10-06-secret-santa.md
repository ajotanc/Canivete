# Amigo secreto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o módulo `secret-santa` do Canivete: uma Appwrite Function que guarda os segredos e sorteia, mais as telas (criar grupo, convite, painel pessoal com revelação, painel do organizador).

**Architecture:** A Function (`functions/secret-santa/`, Node + TypeScript) é a única porta de entrada: tabelas fechadas, uma ação por requisição, lógica pura separada do adaptador Appwrite. O front (`src/modules/secret-santa/`) chama a Function por `Functions.createExecution` através de um cliente fino. O sorteio liga os participantes numa roda única embaralhada.

**Tech Stack:** Node 22 + TypeScript + `node-appwrite` (Function); Vue 3, Vite, Tailwind v4, shadcn-vue, `@lucide/vue`, SDK web `appwrite` (front); Vitest + `@vue/test-utils` (testes, todos em `tests/`).

**Spec:** `docs/superpowers/specs/2026-10-06-secret-santa-design.md` (convenções gerais em `docs/superpowers/specs/2026-10-05-canivete-design.md`)

## Global Constraints

- Identificadores (arquivos, funções, variáveis, tipos, rotas, chaves) em **inglês**; textos de interface, mensagens de erro, comentários e JSDoc em **português (pt-BR)**.
- Estilo 100% **Tailwind v4**; `style` inline só para valores dinâmicos; sem `<style>` em componentes. Componentes shadcn-vue em `src/components/ui/`; ícones só de `@lucide/vue`, sem emoji.
- Vue com `<script setup lang="ts">`. Um módulo nunca importa de outro módulo (`secret-santa` não importa de `raffle`); `functions/` nunca importa de `src/` e vice-versa.
- **Todos os testes ficam em `tests/`**, espelhando a estrutura (`tests/functions/secret-santa/...`, `tests/modules/secret-santa/...`), com imports por `@/` (front) ou caminho relativo `../../../functions/secret-santa/src/...` (Function).
- Limites: grupo com até 100 participantes; nome do grupo 80 caracteres; valor sugerido 40; nome de pessoa 60; desejos 500; PIN com 4 a 6 dígitos (apenas números); sorteio exige 3 ou mais participantes.
- PIN guardado com `scrypt` (sal por participante, comparação em tempo constante); 5 PINs errados bloqueiam por 15 minutos; token do organizador com 32 bytes aleatórios (base64url), só o hash SHA-256 no banco; `nameKey` = NFC, `trim`, espaços colapsados, minúsculas pt-BR.
- Nenhuma resposta da Function devolve pares de outra pessoa; `listParticipants` nunca inclui `assignedToId`.
- Tabelas: `santa_groups` e `santa_participants`, **sem** permissão para `any`. Datetimes em ISO com `Z`.
- Mensagens de commit terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Idioma do site: apenas português.
- Paleta (tokens já no `src/style.css`): `#E3F2FD`, `#1E293B`, `#1D4ED8`, `#3B82F6`, branco. Títulos do módulo em Nunito 800 (`font-display`); corpo em Inter.

## Review Focus

Condições que a spec implica mas que nenhuma tarefa exercitaria sem teste explícito, da mais provável para a menos provável:

1. Nome repetido com acento, caixa ou espaços diferentes ("João", "joao", "  JOÃO  "): `NAME_TAKEN`; e o login funciona com qualquer dessas variações. (Task 1, Task 4, Task 5)
2. PIN inválido (letras, espaço, 3 ou 7 dígitos, número em vez de texto) é rejeitado; PIN errado e nome inexistente respondem igual; 5 erros bloqueiam mesmo com o PIN certo até o prazo passar. (Task 1, Task 5)
3. Sorteio com exatamente 3 pessoas, depois de remoções, repetido, ou com falha no meio da gravação: sem repetir, volta para `open` se falhar, e uma entrada durante ou depois do sorteio é recusada. (Task 3, Task 6)
4. `reveal` e `listParticipants` nunca expõem o par de outra pessoa; o organizador que participa vê só o próprio par. (Task 5, Task 6)
5. Function fora do ar, não configurada, grupo inexistente, id malformado ou recarregar a página no meio do fluxo: mensagens amigáveis em português, sem página em branco, e o PIN nunca na URL nem no `localStorage`. (Task 7, Task 9, Task 11, Task 12)

---

### Task 1: Function: pacote, erros e validação

**Files:**
- Create: `functions/secret-santa/package.json`, `functions/secret-santa/tsconfig.json`, `functions/secret-santa/src/lib/errors.ts`, `functions/secret-santa/src/lib/validate.ts`
- Modify: `tsconfig.json` (incluir `functions/secret-santa/src/**/*.ts`), `.gitignore` (acrescentar `functions/*/dist` e `functions/*/node_modules`)
- Test: `tests/functions/secret-santa/validate.test.ts`

**Interfaces:**
- Produces:
  - `type SantaErrorCode = 'INVALID_INPUT' | 'GROUP_NOT_FOUND' | 'GROUP_CLOSED' | 'NAME_TAKEN' | 'BAD_CREDENTIALS' | 'LOCKED' | 'NOT_ENOUGH_PARTICIPANTS' | 'FORBIDDEN' | 'INTERNAL'`
  - `class SantaError extends Error { readonly code: SantaErrorCode; readonly status: number }`
  - `MAX_PARTICIPANTS = 100`
  - `cleanLine(value: unknown): string`, `toNameKey(name: string): string`
  - `parseGroupName`, `parseBudget`, `parseEventDate`, `parsePersonName`, `parsePin`, `parseWishlist`, `parseGroupId`: cada uma recebe `unknown` e devolve `string` validada ou lança `SantaError('INVALID_INPUT' | 'GROUP_NOT_FOUND')`

- [ ] **Step 1: Criar o pacote da Function**

`functions/secret-santa/package.json`:
```json
{
  "name": "secret-santa-function",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "node-appwrite": "latest"
  },
  "devDependencies": {
    "@types/node": "^22",
    "typescript": "^5"
  }
}
```

`functions/secret-santa/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

Run: `cd functions/secret-santa && npm install && cd ../..`
Expected: instala sem erros.

Em `.gitignore` acrescentar as linhas `functions/*/dist` e `functions/*/node_modules`. Em `tsconfig.json` (raiz) acrescentar `"functions/secret-santa/src/**/*.ts"` ao `include`, **exceto** `appwriteDb.ts` e `main.ts` (que dependem de `node-appwrite` e são checados pelo build da própria Function): usar `"exclude": ["functions/secret-santa/src/appwriteDb.ts", "functions/secret-santa/src/main.ts"]`.

- [ ] **Step 2: Escrever o teste que falha**

`tests/functions/secret-santa/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import {
  cleanLine,
  parseBudget,
  parseEventDate,
  parseGroupId,
  parseGroupName,
  parsePersonName,
  parsePin,
  parseWishlist,
  toNameKey,
} from '../../../functions/secret-santa/src/lib/validate'

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    return (error as SantaError).code
  }
  return undefined
}

describe('toNameKey', () => {
  it('ignora caixa, espaços nas pontas e espaços repetidos', () => {
    expect(toNameKey('  JOÃO   da  Silva ')).toBe('joão da silva')
  })

  it('mantém acento (João e Joao são nomes diferentes)', () => {
    expect(toNameKey('João')).not.toBe(toNameKey('Joao'))
  })

  it('normaliza formas Unicode equivalentes (NFC)', () => {
    expect(toNameKey('João')).toBe(toNameKey('João'))
  })
})

describe('cleanLine', () => {
  it('devolve texto vazio para valores que não são texto', () => {
    expect(cleanLine(42)).toBe('')
    expect(cleanLine(undefined)).toBe('')
  })
})

describe('parseGroupName', () => {
  it('aceita 1 a 80 caracteres e limpa espaços', () => {
    expect(parseGroupName('  Família   Silva ')).toBe('Família Silva')
    expect(parseGroupName('x'.repeat(80))).toHaveLength(80)
  })

  it.each(['', '   ', 'x'.repeat(81), 123, null])('rejeita %j', (value) => {
    expect(codeOf(() => parseGroupName(value))).toBe('INVALID_INPUT')
  })
})

describe('parseBudget', () => {
  it('aceita vazio e até 40 caracteres', () => {
    expect(parseBudget(undefined)).toBe('')
    expect(parseBudget(' R$ 50 ')).toBe('R$ 50')
    expect(codeOf(() => parseBudget('x'.repeat(41)))).toBe('INVALID_INPUT')
  })
})

describe('parseEventDate', () => {
  it('aceita vazio e datas reais no formato AAAA-MM-DD', () => {
    expect(parseEventDate(undefined)).toBe('')
    expect(parseEventDate('2026-12-24')).toBe('2026-12-24')
  })

  it.each(['24/12/2026', '2026-13-01', '2026-02-30', 'amanhã'])('rejeita %s', (value) => {
    expect(codeOf(() => parseEventDate(value))).toBe('INVALID_INPUT')
  })
})

describe('parsePersonName', () => {
  it('aceita 1 a 60 caracteres', () => {
    expect(parsePersonName(' Ana ')).toBe('Ana')
    expect(codeOf(() => parsePersonName(''))).toBe('INVALID_INPUT')
    expect(codeOf(() => parsePersonName('x'.repeat(61)))).toBe('INVALID_INPUT')
  })
})

describe('parsePin', () => {
  it.each(['1234', '12345', '123456', '0000'])('aceita %s', (pin) => {
    expect(parsePin(pin)).toBe(pin)
  })

  it.each(['123', '1234567', '12a4', '12 34', '', ' 1234', 1234, null, undefined])(
    'rejeita %j',
    (pin) => {
      expect(codeOf(() => parsePin(pin))).toBe('INVALID_INPUT')
    },
  )
})

describe('parseWishlist', () => {
  it('aceita vazio, preserva quebras de linha e limita a 500', () => {
    expect(parseWishlist(undefined)).toBe('')
    expect(parseWishlist(' livro\nmeias ')).toBe('livro\nmeias')
    expect(codeOf(() => parseWishlist('x'.repeat(501)))).toBe('INVALID_INPUT')
  })
})

describe('parseGroupId', () => {
  it('aceita ids no formato do Appwrite', () => {
    expect(parseGroupId('abc123.X_-y')).toBe('abc123.X_-y')
  })

  it.each(['', 'a/b', '-inicio', 'x'.repeat(37), 'com espaço', 42, undefined])(
    'devolve GROUP_NOT_FOUND para %j',
    (value) => {
      expect(codeOf(() => parseGroupId(value))).toBe('GROUP_NOT_FOUND')
    },
  )
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/validate.test.ts`
Expected: FAIL (módulos `errors`/`validate` inexistentes).

- [ ] **Step 4: Implementar**

`functions/secret-santa/src/lib/errors.ts`:
```ts
export type SantaErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
  | 'BAD_CREDENTIALS'
  | 'LOCKED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'FORBIDDEN'
  | 'INTERNAL'

/** Status HTTP de cada código de erro. */
const STATUS: Record<SantaErrorCode, number> = {
  INVALID_INPUT: 400,
  GROUP_NOT_FOUND: 404,
  GROUP_CLOSED: 409,
  NAME_TAKEN: 409,
  BAD_CREDENTIALS: 401,
  LOCKED: 429,
  NOT_ENOUGH_PARTICIPANTS: 422,
  FORBIDDEN: 403,
  INTERNAL: 500,
}

/** Erro esperado da Function; a mensagem já vem em português e pode ser mostrada à pessoa. */
export class SantaError extends Error {
  readonly status: number

  constructor(
    public readonly code: SantaErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SantaError'
    this.status = STATUS[code]
  }
}
```

`functions/secret-santa/src/lib/validate.ts`:
```ts
import { SantaError } from './errors.js'

export const MAX_GROUP_NAME = 80
export const MAX_BUDGET = 40
export const MAX_PERSON_NAME = 60
export const MAX_WISHLIST = 500
export const MAX_PARTICIPANTS = 100

/** Texto de uma linha: NFC, espaços nas pontas removidos e espaços repetidos colapsados. */
export function cleanLine(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.normalize('NFC').trim().replace(/\s+/g, ' ')
}

/** Chave de comparação de nomes: ignora caixa e espaços, mas mantém acentos. */
export function toNameKey(name: string): string {
  return cleanLine(name).toLocaleLowerCase('pt-BR')
}

export function parseGroupName(value: unknown): string {
  const name = cleanLine(value)
  if (name.length < 1 || name.length > MAX_GROUP_NAME) {
    throw new SantaError('INVALID_INPUT', `Informe o nome do grupo (até ${MAX_GROUP_NAME} caracteres).`)
  }
  return name
}

export function parseBudget(value: unknown): string {
  const budget = cleanLine(value)
  if (budget.length > MAX_BUDGET) {
    throw new SantaError('INVALID_INPUT', `O valor sugerido pode ter até ${MAX_BUDGET} caracteres.`)
  }
  return budget
}

/** Aceita vazio ou uma data real no formato AAAA-MM-DD. */
export function parseEventDate(value: unknown): string {
  const date = cleanLine(value)
  if (date === '') return ''
  const isReal =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  if (!isReal) {
    throw new SantaError('INVALID_INPUT', 'Informe a data no formato AAAA-MM-DD, por exemplo 2026-12-24.')
  }
  return date
}

export function parsePersonName(value: unknown): string {
  const name = cleanLine(value)
  if (name.length < 1 || name.length > MAX_PERSON_NAME) {
    throw new SantaError('INVALID_INPUT', `Informe seu nome (até ${MAX_PERSON_NAME} caracteres).`)
  }
  return name
}

/** O PIN precisa ser texto com 4 a 6 números, sem espaços. */
export function parsePin(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4,6}$/.test(value)) {
    throw new SantaError('INVALID_INPUT', 'O PIN precisa ter de 4 a 6 números.')
  }
  return value
}

/** Lista de desejos: preserva quebras de linha, remove só as pontas. */
export function parseWishlist(value: unknown): string {
  const wishlist = typeof value === 'string' ? value.normalize('NFC').trim() : ''
  if (wishlist.length > MAX_WISHLIST) {
    throw new SantaError('INVALID_INPUT', `A lista de desejos pode ter até ${MAX_WISHLIST} caracteres.`)
  }
  return wishlist
}

/** Ids fora do formato do Appwrite nunca existem: tratados como grupo não encontrado. */
export function parseGroupId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)) {
    throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  }
  return value
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa/validate.test.ts && npm run typecheck`
Expected: todos passando; typecheck sem erros.

- [ ] **Step 6: Commit**

```bash
git add functions/secret-santa/package.json functions/secret-santa/package-lock.json functions/secret-santa/tsconfig.json functions/secret-santa/src tests/functions .gitignore tsconfig.json
git commit -m "feat(santa): add function package, errors and input validation" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Function: PIN e tokens

**Files:**
- Create: `functions/secret-santa/src/lib/pin.ts`, `functions/secret-santa/src/lib/tokens.ts`
- Test: `tests/functions/secret-santa/pin.test.ts`, `tests/functions/secret-santa/tokens.test.ts`

**Interfaces:**
- Produces:
  - `hashPin(pin: string): Promise<string>` (formato `scrypt$<salt b64>$<chave b64>`, menos de 200 caracteres)
  - `verifyPin(pin: string, stored: string): Promise<boolean>`
  - `generateToken(): string`, `hashToken(token: string): string` (hex de 64 caracteres), `tokenMatches(token: unknown, storedHash: string): boolean`

- [ ] **Step 1: Escrever os testes que falham**

`tests/functions/secret-santa/pin.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { hashPin, verifyPin } from '../../../functions/secret-santa/src/lib/pin'

describe('hashPin / verifyPin', () => {
  it('confirma o PIN certo e recusa o errado', async () => {
    const stored = await hashPin('1234')
    expect(await verifyPin('1234', stored)).toBe(true)
    expect(await verifyPin('1235', stored)).toBe(false)
  })

  it('usa um sal diferente a cada hash', async () => {
    expect(await hashPin('1234')).not.toBe(await hashPin('1234'))
  })

  it('não contém o PIN e cabe na coluna de 200 caracteres', async () => {
    const stored = await hashPin('987654')
    expect(stored).not.toContain('987654')
    expect(stored.length).toBeLessThan(200)
  })

  it('recusa valores guardados em formato inválido', async () => {
    expect(await verifyPin('1234', 'lixo')).toBe(false)
    expect(await verifyPin('1234', '')).toBe(false)
  })
})
```

`tests/functions/secret-santa/tokens.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, tokenMatches } from '../../../functions/secret-santa/src/lib/tokens'

describe('tokens', () => {
  it('gera tokens diferentes e longos o bastante', () => {
    const a = generateToken()
    expect(a).not.toBe(generateToken())
    expect(a.length).toBeGreaterThanOrEqual(43)
  })

  it('o hash tem 64 caracteres hexadecimais e é estável', () => {
    const hash = hashToken('abc')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(hashToken('abc'))
    // Vetor conhecido de SHA-256 para "abc".
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('confere só o token certo', () => {
    const token = generateToken()
    const stored = hashToken(token)
    expect(tokenMatches(token, stored)).toBe(true)
    expect(tokenMatches(`${token}x`, stored)).toBe(false)
  })

  it.each([undefined, null, '', 42])('recusa token inválido %j', (value) => {
    expect(tokenMatches(value, hashToken('abc'))).toBe(false)
  })

  it('recusa hash guardado inválido sem lançar erro', () => {
    expect(tokenMatches('abc', 'curto')).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/pin.test.ts tests/functions/secret-santa/tokens.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar**

`functions/secret-santa/src/lib/pin.ts`:
```ts
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>

const KEY_LENGTH = 32

/** Gera o hash do PIN com scrypt e um sal novo: "scrypt$<sal>$<chave>". */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(pin, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

/** Confere o PIN contra o hash guardado, em tempo constante. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [kind, saltBase64, keyBase64] = stored.split('$')
  if (kind !== 'scrypt' || !saltBase64 || !keyBase64) return false
  const expected = Buffer.from(keyBase64, 'base64')
  const actual = await scrypt(pin, Buffer.from(saltBase64, 'base64'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
```

`functions/secret-santa/src/lib/tokens.ts`:
```ts
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Token do organizador: 32 bytes aleatórios em base64url. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/** SHA-256 em hexadecimal. É o único dado do token guardado no banco. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Confere um token recebido contra o hash guardado, em tempo constante. */
export function tokenMatches(token: unknown, storedHash: string): boolean {
  if (typeof token !== 'string' || token === '') return false
  const actual = Buffer.from(hashToken(token), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa && npm run typecheck`
Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
git add functions/secret-santa/src/lib tests/functions
git commit -m "feat(santa): add PIN hashing and organizer tokens" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Function: sorteio em roda única

**Files:**
- Create: `functions/secret-santa/src/lib/random.ts`, `functions/secret-santa/src/lib/draw.ts`
- Test: `tests/functions/secret-santa/draw.test.ts`

**Interfaces:**
- Produces:
  - `type RandomInt = (maxExclusive: number) => number`, `secureRandomInt(maxExclusive: number): number`
  - `assignSecretFriends(ids: string[], randomInt?: RandomInt): Map<string, string>` (cada id tira o seguinte numa roda embaralhada; lança `SantaError('NOT_ENOUGH_PARTICIPANTS')` com menos de 3)

- [ ] **Step 1: Escrever o teste que falha**

`tests/functions/secret-santa/draw.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { assignSecretFriends } from '../../../functions/secret-santa/src/lib/draw'
import { secureRandomInt } from '../../../functions/secret-santa/src/lib/random'

const ids = ['a', 'b', 'c', 'd', 'e']

describe('secureRandomInt', () => {
  it('fica dentro de [0, max) e rejeita limites inválidos', () => {
    for (let i = 0; i < 1000; i++) {
      const value = secureRandomInt(7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
    }
    expect(() => secureRandomInt(0)).toThrow()
  })
})

describe('assignSecretFriends', () => {
  it('com fonte sem trocas, a roda segue a ordem da lista', () => {
    const result = assignSecretFriends(['a', 'b', 'c'], (max) => max - 1)
    expect([...result.entries()]).toEqual([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ])
  })

  it('ninguém tira a si mesmo, cada um dá e recebe exatamente uma vez', () => {
    for (let i = 0; i < 200; i++) {
      const result = assignSecretFriends(ids)
      expect(result.size).toBe(ids.length)
      for (const [giver, receiver] of result) expect(giver).not.toBe(receiver)
      expect(new Set(result.keys())).toEqual(new Set(ids))
      expect(new Set(result.values())).toEqual(new Set(ids))
    }
  })

  it('forma uma roda única (seguindo os pares, passa por todos antes de voltar)', () => {
    for (let i = 0; i < 100; i++) {
      const result = assignSecretFriends(ids)
      let current = ids[0]
      const visited = new Set<string>()
      do {
        visited.add(current)
        current = result.get(current)!
      } while (current !== ids[0])
      expect(visited.size).toBe(ids.length)
    }
  })

  it('funciona com exatamente 3 participantes', () => {
    const result = assignSecretFriends(['x', 'y', 'z'])
    for (const [giver, receiver] of result) expect(giver).not.toBe(receiver)
  })

  it.each([[[]], [['a']], [['a', 'b']]])('recusa menos de 3 participantes: %j', (list) => {
    expect(() => assignSecretFriends(list)).toThrowError(/pelo menos 3/)
    try {
      assignSecretFriends(list)
    } catch (error) {
      expect((error as { code: string }).code).toBe('NOT_ENOUGH_PARTICIPANTS')
    }
  })

  it('não altera a lista recebida', () => {
    const input = ['a', 'b', 'c']
    assignSecretFriends(input)
    expect(input).toEqual(['a', 'b', 'c'])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/draw.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar**

`functions/secret-santa/src/lib/random.ts`:
```ts
import { randomInt } from 'node:crypto'

/** Fonte de inteiros aleatórios em [0, maxExclusive). Injetável para testes determinísticos. */
export type RandomInt = (maxExclusive: number) => number

/** Inteiro uniforme e sem viés (o `crypto.randomInt` do Node já usa rejeição). */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError('O limite precisa ser um inteiro maior ou igual a 1.')
  }
  return randomInt(maxExclusive)
}
```

`functions/secret-santa/src/lib/draw.ts`:
```ts
import { SantaError } from './errors.js'
import { secureRandomInt, type RandomInt } from './random.js'

/**
 * Sorteia o amigo secreto de cada participante numa roda única embaralhada:
 * cada um tira o seguinte e o último tira o primeiro. Ninguém tira a si mesmo.
 */
export function assignSecretFriends(
  ids: string[],
  randomInt: RandomInt = secureRandomInt,
): Map<string, string> {
  if (ids.length < 3) {
    throw new SantaError('NOT_ENOUGH_PARTICIPANTS', 'São necessárias pelo menos 3 pessoas para sortear.')
  }

  const order = [...ids]
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  const result = new Map<string, string>()
  order.forEach((giver, index) => {
    result.set(giver, order[(index + 1) % order.length])
  })
  return result
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa/draw.test.ts`
Expected: todos passando. (Nota para o teste da fonte sem trocas: com `max - 1` o embaralhamento não troca nada, então `order` fica igual a `ids`.)

- [ ] **Step 5: Commit**

```bash
git add functions/secret-santa/src/lib tests/functions
git commit -m "feat(santa): add single-cycle secret friend draw" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Function: handler (grupo, entrada, organizador)

**Files:**
- Create: `functions/secret-santa/src/types.ts`, `functions/secret-santa/src/handler.ts`, `tests/functions/secret-santa/fakeDb.ts`
- Test: `tests/functions/secret-santa/handler.group.test.ts`

**Interfaces:**
- Consumes: `SantaError`, `parse*`, `toNameKey`, `MAX_PARTICIPANTS` (Task 1); `hashPin` (Task 2); `generateToken`, `hashToken`, `tokenMatches` (Task 2).
- Produces:
  - `types.ts`: `GroupStatus = 'open' | 'drawing' | 'drawn'`; `GroupRow { id; name; budget; eventDate; organizerTokenHash; status }`; `ParticipantRow { id; groupId; name; nameKey; wishlist; pinHash; failedAttempts: number; lockedUntil: string | null; assignedToId: string | null; isOrganizer: boolean }`; `SantaDb` com `createGroup(group: Omit<GroupRow,'id'>): Promise<string>`, `getGroup(id): Promise<GroupRow | null>`, `setGroupStatus(id, status): Promise<void>`, `createParticipant(p: Omit<ParticipantRow,'id'>): Promise<string>`, `listParticipants(groupId): Promise<ParticipantRow[]>`, `updateParticipant(id, patch: Partial<Omit<ParticipantRow,'id'>>): Promise<void>`, `deleteParticipant(id): Promise<void>`
  - `handler.ts`: `handleAction(db: SantaDb, body: unknown, deps?: { now?: () => Date; randomInt?: RandomInt }): Promise<unknown>`
  - `fakeDb.ts`: `createFakeDb(): SantaDb & { groups: Map<string, GroupRow>; participants: Map<string, ParticipantRow>; failUpdateParticipantAfter(n: number): void }`

- [ ] **Step 1: Criar os tipos e o banco falso**

`functions/secret-santa/src/types.ts`:
```ts
export type GroupStatus = 'open' | 'drawing' | 'drawn'

export interface GroupRow {
  id: string
  name: string
  /** Texto livre; vazio quando não informado. */
  budget: string
  /** AAAA-MM-DD; vazio quando não informado. */
  eventDate: string
  organizerTokenHash: string
  status: GroupStatus
}

export interface ParticipantRow {
  id: string
  groupId: string
  name: string
  nameKey: string
  wishlist: string
  pinHash: string
  failedAttempts: number
  /** ISO com Z, ou null quando não está bloqueado. */
  lockedUntil: string | null
  assignedToId: string | null
  isOrganizer: boolean
}

/** Acesso ao banco. A implementação real usa o Appwrite; os testes usam um banco em memória. */
export interface SantaDb {
  createGroup(group: Omit<GroupRow, 'id'>): Promise<string>
  getGroup(id: string): Promise<GroupRow | null>
  setGroupStatus(id: string, status: GroupStatus): Promise<void>
  createParticipant(participant: Omit<ParticipantRow, 'id'>): Promise<string>
  listParticipants(groupId: string): Promise<ParticipantRow[]>
  updateParticipant(id: string, patch: Partial<Omit<ParticipantRow, 'id'>>): Promise<void>
  deleteParticipant(id: string): Promise<void>
}
```

`tests/functions/secret-santa/fakeDb.ts`:
```ts
import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import type { GroupRow, ParticipantRow, SantaDb } from '../../../functions/secret-santa/src/types'

/** Banco em memória que imita o contrato do Appwrite, incluindo a unicidade de (grupo, nome). */
export function createFakeDb() {
  const groups = new Map<string, GroupRow>()
  const participants = new Map<string, ParticipantRow>()
  let counter = 0
  let updatesLeft: number | null = null

  const db: SantaDb & {
    groups: typeof groups
    participants: typeof participants
    failUpdateParticipantAfter(n: number): void
  } = {
    groups,
    participants,
    failUpdateParticipantAfter(n) {
      updatesLeft = n
    },
    async createGroup(group) {
      const id = `g${++counter}`
      groups.set(id, { id, ...group })
      return id
    },
    async getGroup(id) {
      return groups.get(id) ?? null
    },
    async setGroupStatus(id, status) {
      const group = groups.get(id)
      if (group) group.status = status
    },
    async createParticipant(participant) {
      const duplicate = [...participants.values()].some(
        (p) => p.groupId === participant.groupId && p.nameKey === participant.nameKey,
      )
      if (duplicate) {
        throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
      }
      const id = `p${++counter}`
      participants.set(id, { id, ...participant })
      return id
    },
    async listParticipants(groupId) {
      return [...participants.values()].filter((p) => p.groupId === groupId)
    },
    async updateParticipant(id, patch) {
      if (updatesLeft !== null) {
        if (updatesLeft === 0) throw new Error('falha simulada')
        updatesLeft -= 1
      }
      const current = participants.get(id)
      if (current) participants.set(id, { ...current, ...patch })
    },
    async deleteParticipant(id) {
      participants.delete(id)
    },
  }
  return db
}
```

- [ ] **Step 2: Escrever o teste que falha**

`tests/functions/secret-santa/handler.group.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { hashToken } from '../../../functions/secret-santa/src/lib/tokens'
import { createFakeDb } from './fakeDb'

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function newGroup(db = createFakeDb(), extra: Record<string, unknown> = {}) {
  const data = (await handleAction(db, { action: 'createGroup', name: 'Família', ...extra })) as {
    groupId: string
    adminToken: string
  }
  return { db, ...data }
}

describe('createGroup', () => {
  it('cria o grupo aberto e devolve o token do organizador, guardando só o hash', async () => {
    const { db, groupId, adminToken } = await newGroup(createFakeDb(), { budget: 'R$ 50', eventDate: '2026-12-24' })
    const group = db.groups.get(groupId)!
    expect(group.status).toBe('open')
    expect(group.budget).toBe('R$ 50')
    expect(group.organizerTokenHash).toBe(hashToken(adminToken))
    expect(JSON.stringify([...db.groups.values()])).not.toContain(adminToken)
  })

  it('cria também o organizador como participante quando ele participa', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), {
      organizer: { name: 'Lia', pin: '4321', wishlist: 'livro' },
    })
    const [organizer] = await db.listParticipants(groupId)
    expect(organizer).toMatchObject({ name: 'Lia', isOrganizer: true, wishlist: 'livro' })
    expect(organizer.pinHash).not.toContain('4321')
  })

  it('rejeita dados inválidos', async () => {
    const db = createFakeDb()
    expect(await errorCode(handleAction(db, { action: 'createGroup', name: '' }))).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', eventDate: '2026-02-30' })),
    ).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', organizer: { name: 'Lia', pin: 'abcd' } })),
    ).toBe('INVALID_INPUT')
    expect(db.groups.size).toBe(0)
  })
})

describe('getGroup', () => {
  it('devolve só dados públicos e a contagem', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    const info = (await handleAction(db, { action: 'getGroup', groupId })) as Record<string, unknown>
    expect(info).toEqual({ name: 'Família', budget: '', eventDate: '', status: 'open', participantCount: 1 })
  })

  it('devolve GROUP_NOT_FOUND para id inexistente ou malformado', async () => {
    const db = createFakeDb()
    expect(await errorCode(handleAction(db, { action: 'getGroup', groupId: 'naoexiste' }))).toBe('GROUP_NOT_FOUND')
    expect(await errorCode(handleAction(db, { action: 'getGroup', groupId: '../x' }))).toBe('GROUP_NOT_FOUND')
    expect(await errorCode(handleAction(db, { action: 'getGroup' }))).toBe('GROUP_NOT_FOUND')
  })
})

describe('join', () => {
  it('adiciona o participante com o PIN em hash', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'join', groupId, name: ' Ana ', pin: '1234', wishlist: 'meias' })
    const [ana] = await db.listParticipants(groupId)
    expect(ana).toMatchObject({ name: 'Ana', nameKey: 'ana', isOrganizer: false, failedAttempts: 0 })
    expect(ana.pinHash).toMatch(/^scrypt\$/)
  })

  it('recusa nome repetido com acento, caixa ou espaços diferentes', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'join', groupId, name: 'João', pin: '1234' })
    for (const name of ['joão', '  JOÃO  ', 'João']) {
      expect(await errorCode(handleAction(db, { action: 'join', groupId, name, pin: '1234' }))).toBe('NAME_TAKEN')
    }
    // Sem acento é outro nome.
    await handleAction(db, { action: 'join', groupId, name: 'Joao', pin: '1234' })
    expect((await db.listParticipants(groupId)).length).toBe(2)
  })

  it('recusa PIN inválido', async () => {
    const { db, groupId } = await newGroup()
    for (const pin of ['123', '1234567', '12a4', 1234, undefined]) {
      expect(await errorCode(handleAction(db, { action: 'join', groupId, name: 'Ana', pin }))).toBe('INVALID_INPUT')
    }
  })

  it('recusa entrada quando o grupo não está aberto', async () => {
    const { db, groupId } = await newGroup()
    for (const status of ['drawing', 'drawn'] as const) {
      await db.setGroupStatus(groupId, status)
      expect(await errorCode(handleAction(db, { action: 'join', groupId, name: 'Ana', pin: '1234' }))).toBe(
        'GROUP_CLOSED',
      )
    }
  })

  it('recusa o 101º participante', async () => {
    const { db, groupId } = await newGroup()
    for (let i = 0; i < 100; i++) {
      await db.createParticipant({
        groupId, name: `P${i}`, nameKey: `p${i}`, wishlist: '', pinHash: 'x',
        failedAttempts: 0, lockedUntil: null, assignedToId: null, isOrganizer: false,
      })
    }
    expect(await errorCode(handleAction(db, { action: 'join', groupId, name: 'Extra', pin: '1234' }))).toBe(
      'INVALID_INPUT',
    )
  })
})

describe('listParticipants e removeParticipant (organizador)', () => {
  it('exige o token do organizador', async () => {
    const { db, groupId } = await newGroup()
    for (const adminToken of [undefined, '', 'errado']) {
      expect(await errorCode(handleAction(db, { action: 'listParticipants', groupId, adminToken }))).toBe('FORBIDDEN')
      expect(
        await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
      ).toBe('FORBIDDEN')
    }
  })

  it('lista só nomes e se participa, sem PIN, desejos nem pares', async () => {
    const { db, groupId, adminToken } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    await handleAction(db, { action: 'join', groupId, name: 'Ana', pin: '1234', wishlist: 'segredo' })
    const result = (await handleAction(db, { action: 'listParticipants', groupId, adminToken })) as {
      status: string
      participants: Record<string, unknown>[]
    }
    expect(result.status).toBe('open')
    expect(result.participants).toEqual([
      { name: 'Lia', isOrganizer: true },
      { name: 'Ana', isOrganizer: false },
    ])
    expect(JSON.stringify(result)).not.toContain('segredo')
  })

  it('remove um participante antes do sorteio (nome com variações) e recusa depois', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await handleAction(db, { action: 'join', groupId, name: 'Ana', pin: '1234' })
    await handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: ' ANA ' })
    expect((await db.listParticipants(groupId)).length).toBe(0)

    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
    ).toBe('INVALID_INPUT')

    await db.setGroupStatus(groupId, 'drawn')
    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
    ).toBe('GROUP_CLOSED')
  })
})

describe('ações desconhecidas', () => {
  it('devolve INVALID_INPUT', async () => {
    expect(await errorCode(handleAction(createFakeDb(), { action: 'nada' }))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(createFakeDb(), null))).toBe('INVALID_INPUT')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/handler.group.test.ts`
Expected: FAIL (`handler` inexistente).

- [ ] **Step 4: Implementar o handler (ações de grupo, entrada e organizador)**

`functions/secret-santa/src/handler.ts`:
```ts
import { SantaError } from './lib/errors.js'
import { hashPin } from './lib/pin.js'
import type { RandomInt } from './lib/random.js'
import { generateToken, hashToken, tokenMatches } from './lib/tokens.js'
import {
  MAX_PARTICIPANTS,
  parseBudget,
  parseEventDate,
  parseGroupId,
  parseGroupName,
  parsePersonName,
  parsePin,
  parseWishlist,
  toNameKey,
} from './lib/validate.js'
import type { GroupRow, SantaDb } from './types.js'

export interface HandlerDeps {
  now?: () => Date
  randomInt?: RandomInt
}

type Input = Record<string, unknown>

/** Executa uma ação da Function. Erros esperados são SantaError com mensagem em português. */
export async function handleAction(db: SantaDb, body: unknown, deps: HandlerDeps = {}): Promise<unknown> {
  const input: Input = body !== null && typeof body === 'object' ? (body as Input) : {}

  switch (input.action) {
    case 'createGroup':
      return createGroup(db, input)
    case 'getGroup':
      return getGroup(db, input)
    case 'join':
      return join(db, input)
    case 'listParticipants':
      return listParticipants(db, input)
    case 'removeParticipant':
      return removeParticipant(db, input)
    default:
      void deps
      throw new SantaError('INVALID_INPUT', 'Ação desconhecida.')
  }
}

async function requireGroup(db: SantaDb, rawId: unknown): Promise<GroupRow> {
  const group = await db.getGroup(parseGroupId(rawId))
  if (!group) throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  return group
}

function requireOrganizer(group: GroupRow, token: unknown): void {
  if (!tokenMatches(token, group.organizerTokenHash)) {
    throw new SantaError('FORBIDDEN', 'Você não tem permissão para fazer isso neste grupo.')
  }
}

function requireOpen(group: GroupRow): void {
  if (group.status !== 'open') {
    throw new SantaError('GROUP_CLOSED', 'Este grupo já foi sorteado.')
  }
}

async function createGroup(db: SantaDb, input: Input) {
  const name = parseGroupName(input.name)
  const budget = parseBudget(input.budget)
  const eventDate = parseEventDate(input.eventDate)

  const organizer = input.organizer
  const organizerData =
    organizer !== null && typeof organizer === 'object'
      ? {
          name: parsePersonName((organizer as Input).name),
          pin: parsePin((organizer as Input).pin),
          wishlist: parseWishlist((organizer as Input).wishlist),
        }
      : null

  const adminToken = generateToken()
  const groupId = await db.createGroup({
    name,
    budget,
    eventDate,
    organizerTokenHash: hashToken(adminToken),
    status: 'open',
  })

  if (organizerData) {
    await db.createParticipant({
      groupId,
      name: organizerData.name,
      nameKey: toNameKey(organizerData.name),
      wishlist: organizerData.wishlist,
      pinHash: await hashPin(organizerData.pin),
      failedAttempts: 0,
      lockedUntil: null,
      assignedToId: null,
      isOrganizer: true,
    })
  }

  return { groupId, adminToken }
}

async function getGroup(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  const participants = await db.listParticipants(group.id)
  return {
    name: group.name,
    budget: group.budget,
    eventDate: group.eventDate,
    status: group.status,
    participantCount: participants.length,
  }
}

async function join(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOpen(group)

  const name = parsePersonName(input.name)
  const pin = parsePin(input.pin)
  const wishlist = parseWishlist(input.wishlist)
  const nameKey = toNameKey(name)

  const participants = await db.listParticipants(group.id)
  if (participants.length >= MAX_PARTICIPANTS) {
    throw new SantaError('INVALID_INPUT', `Este grupo já tem ${MAX_PARTICIPANTS} pessoas, que é o limite.`)
  }
  if (participants.some((p) => p.nameKey === nameKey)) {
    throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
  }

  await db.createParticipant({
    groupId: group.id,
    name,
    nameKey,
    wishlist,
    pinHash: await hashPin(pin),
    failedAttempts: 0,
    lockedUntil: null,
    assignedToId: null,
    isOrganizer: false,
  })
  return {}
}

async function listParticipants(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, input.adminToken)
  const participants = await db.listParticipants(group.id)
  return {
    status: group.status,
    participants: participants.map((p) => ({ name: p.name, isOrganizer: p.isOrganizer })),
  }
}

async function removeParticipant(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, input.adminToken)
  requireOpen(group)

  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const target = (await db.listParticipants(group.id)).find((p) => p.nameKey === key)
  if (!target) throw new SantaError('INVALID_INPUT', 'Participante não encontrado.')
  await db.deleteParticipant(target.id)
  return {}
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa && npm run typecheck`
Expected: todos passando; typecheck sem erros.

- [ ] **Step 6: Commit**

```bash
git add functions/secret-santa/src tests/functions
git commit -m "feat(santa): add group, join and organizer actions to the handler" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Function: autenticação por nome e PIN, bloqueio, desejos e revelação

**Files:**
- Modify: `functions/secret-santa/src/handler.ts`
- Test: `tests/functions/secret-santa/handler.auth.test.ts`

**Interfaces:**
- Consumes: `handleAction`, `createFakeDb` (Task 4); `verifyPin` (Task 2).
- Produces: ações `updateWishlist` e `reveal`; constantes `LOCK_AFTER_FAILURES = 5`, `LOCK_MINUTES = 15`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functions/secret-santa/handler.auth.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { createFakeDb } from './fakeDb'

async function errorOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error as { code?: string; message: string }
  }
  return undefined
}

async function setup() {
  const db = createFakeDb()
  const { groupId, adminToken } = (await handleAction(db, { action: 'createGroup', name: 'Família' })) as {
    groupId: string
    adminToken: string
  }
  await handleAction(db, { action: 'join', groupId, name: 'João', pin: '1234', wishlist: 'livro' })
  return { db, groupId, adminToken }
}

describe('reveal antes do sorteio', () => {
  it('devolve status open e a própria lista de desejos', async () => {
    const { db, groupId } = await setup()
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toEqual({
      status: 'open',
      wishlist: 'livro',
    })
  })

  it('aceita variações de caixa, acento igual e espaços no nome', async () => {
    const { db, groupId } = await setup()
    for (const name of ['joão', '  JOÃO ', 'João']) {
      expect(await handleAction(db, { action: 'reveal', groupId, name, pin: '1234' })).toMatchObject({ status: 'open' })
    }
  })
})

describe('credenciais inválidas', () => {
  it('PIN errado e nome inexistente respondem exatamente igual', async () => {
    const { db, groupId } = await setup()
    const wrongPin = await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '9999' }))
    const noName = await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'Ninguém', pin: '9999' }))
    expect(wrongPin?.code).toBe('BAD_CREDENTIALS')
    expect(noName?.code).toBe('BAD_CREDENTIALS')
    expect(wrongPin?.message).toBe(noName?.message)
  })

  it('PIN com formato inválido é recusado antes de consultar o grupo', async () => {
    const { db, groupId } = await setup()
    for (const pin of ['12', '12a4', 1234, undefined]) {
      expect((await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin })))?.code).toBe(
        'INVALID_INPUT',
      )
    }
  })

  it('grupo inexistente devolve GROUP_NOT_FOUND', async () => {
    const { db } = await setup()
    expect(
      (await errorOf(handleAction(db, { action: 'reveal', groupId: 'naoexiste', name: 'João', pin: '1234' })))?.code,
    ).toBe('GROUP_NOT_FOUND')
  })
})

describe('bloqueio por tentativas', () => {
  it('bloqueia no 5º erro, mesmo com o PIN certo, até o prazo de 15 minutos passar', async () => {
    const { db, groupId } = await setup()
    let now = new Date('2026-10-06T12:00:00.000Z')
    const deps = { now: () => now }
    const wrong = { action: 'reveal', groupId, name: 'João', pin: '0000' }

    for (let i = 0; i < 4; i++) {
      expect((await errorOf(handleAction(db, wrong, deps)))?.code).toBe('BAD_CREDENTIALS')
    }
    expect((await errorOf(handleAction(db, wrong, deps)))?.code).toBe('LOCKED')

    // Com o PIN certo, ainda bloqueado.
    const right = { action: 'reveal', groupId, name: 'João', pin: '1234' }
    const locked = await errorOf(handleAction(db, right, deps))
    expect(locked?.code).toBe('LOCKED')
    expect(locked?.message).toMatch(/15 minutos/)

    // 14 minutos depois, ainda bloqueado; 16 minutos depois, libera e zera o contador.
    now = new Date('2026-10-06T12:14:00.000Z')
    expect((await errorOf(handleAction(db, right, deps)))?.code).toBe('LOCKED')
    now = new Date('2026-10-06T12:16:00.000Z')
    expect(await handleAction(db, right, deps)).toMatchObject({ status: 'open' })
    const [joao] = await db.listParticipants(groupId)
    expect(joao.failedAttempts).toBe(0)
    expect(joao.lockedUntil).toBeNull()
  })

  it('um acerto zera as tentativas erradas anteriores', async () => {
    const { db, groupId } = await setup()
    await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '0000' }))
    await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '0000' }))
    await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })
    expect((await db.listParticipants(groupId))[0].failedAttempts).toBe(0)
  })
})

describe('updateWishlist', () => {
  it('atualiza a lista com nome e PIN certos', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: ' meias \nchá' })
    expect((await db.listParticipants(groupId))[0].wishlist).toBe('meias \nchá')
  })

  it('recusa PIN errado e recusa depois do sorteio', async () => {
    const { db, groupId } = await setup()
    expect(
      (await errorOf(handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '9999', wishlist: 'x' })))
        ?.code,
    ).toBe('BAD_CREDENTIALS')
    await db.setGroupStatus(groupId, 'drawn')
    expect(
      (await errorOf(handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: 'x' })))
        ?.code,
    ).toBe('GROUP_CLOSED')
  })

  it('recusa lista longa demais', async () => {
    const { db, groupId } = await setup()
    expect(
      (await errorOf(
        handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: 'x'.repeat(501) }),
      ))?.code,
    ).toBe('INVALID_INPUT')
  })
})

describe('reveal depois do sorteio', () => {
  it('devolve só o par de quem pergunta e a lista dele', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'join', groupId, name: 'Ana', pin: '1111', wishlist: 'chocolate' })
    await handleAction(db, { action: 'join', groupId, name: 'Bia', pin: '2222', wishlist: 'caneca' })
    const [joao, ana, bia] = await db.listParticipants(groupId)
    // Roda: João -> Ana -> Bia -> João
    await db.updateParticipant(joao.id, { assignedToId: ana.id })
    await db.updateParticipant(ana.id, { assignedToId: bia.id })
    await db.updateParticipant(bia.id, { assignedToId: joao.id })
    await db.setGroupStatus(groupId, 'drawn')

    const result = await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })
    expect(result).toEqual({
      status: 'drawn',
      wishlist: 'livro',
      receiver: { name: 'Ana', wishlist: 'chocolate' },
    })
    const text = JSON.stringify(result)
    expect(text).not.toContain('Bia')
    expect(text).not.toContain('caneca')
  })

  it('durante o sorteio (drawing) ainda responde como open, sem revelar nada', async () => {
    const { db, groupId } = await setup()
    await db.setGroupStatus(groupId, 'drawing')
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toEqual({
      status: 'open',
      wishlist: 'livro',
    })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/handler.auth.test.ts`
Expected: FAIL (`Ação desconhecida` para `reveal`/`updateWishlist`).

- [ ] **Step 3: Implementar**

Em `functions/secret-santa/src/handler.ts`, adicionar `import { verifyPin } from './lib/pin.js'` (ao lado de `hashPin`), `import type { ParticipantRow } from './types.js'` (ao lado de `GroupRow, SantaDb`), e, antes de `handleAction`, as constantes:

```ts
export const LOCK_AFTER_FAILURES = 5
export const LOCK_MINUTES = 15
```

No `switch` de `handleAction`, trocar o `default` por:

```ts
    case 'updateWishlist':
      return updateWishlist(db, input, now)
    case 'reveal':
      return reveal(db, input, now)
    default:
      throw new SantaError('INVALID_INPUT', 'Ação desconhecida.')
```

e, no início de `handleAction`, depois de `const input`, acrescentar `const now = deps.now ?? (() => new Date())`.

Ao final do arquivo, acrescentar:

```ts
/**
 * Confere nome e PIN. Nome inexistente e PIN errado respondem igual (BAD_CREDENTIALS);
 * a 5ª falha seguida bloqueia o participante por 15 minutos.
 */
async function authenticate(
  db: SantaDb,
  input: Input,
  now: () => Date,
): Promise<{ group: GroupRow; participant: ParticipantRow; participants: ParticipantRow[] }> {
  const pin = parsePin(input.pin)
  const group = await requireGroup(db, input.groupId)
  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const participants = await db.listParticipants(group.id)
  const participant = participants.find((p) => p.nameKey === key)
  if (!participant) {
    throw new SantaError('BAD_CREDENTIALS', 'Nome ou PIN incorretos.')
  }

  if (participant.lockedUntil && new Date(participant.lockedUntil) > now()) {
    throw lockedError(participant.lockedUntil, now())
  }

  if (!(await verifyPin(pin, participant.pinHash))) {
    const failures = participant.failedAttempts + 1
    if (failures >= LOCK_AFTER_FAILURES) {
      const until = new Date(now().getTime() + LOCK_MINUTES * 60_000).toISOString()
      await db.updateParticipant(participant.id, { failedAttempts: 0, lockedUntil: until })
      throw lockedError(until, now())
    }
    await db.updateParticipant(participant.id, { failedAttempts: failures })
    throw new SantaError('BAD_CREDENTIALS', 'Nome ou PIN incorretos.')
  }

  if (participant.failedAttempts > 0 || participant.lockedUntil) {
    await db.updateParticipant(participant.id, { failedAttempts: 0, lockedUntil: null })
  }
  return { group, participant, participants }
}

function lockedError(until: string, current: Date): SantaError {
  const minutes = Math.max(1, Math.ceil((new Date(until).getTime() - current.getTime()) / 60_000))
  return new SantaError('LOCKED', `Muitas tentativas. Tente de novo em ${minutes} minutos.`)
}

async function updateWishlist(db: SantaDb, input: Input, now: () => Date) {
  const wishlist = parseWishlist(input.wishlist)
  const { group, participant } = await authenticate(db, input, now)
  requireOpen(group)
  await db.updateParticipant(participant.id, { wishlist })
  return {}
}

async function reveal(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant, participants } = await authenticate(db, input, now)

  if (group.status !== 'drawn') {
    return { status: 'open' as const, wishlist: participant.wishlist }
  }

  const receiver = participants.find((p) => p.id === participant.assignedToId)
  if (!receiver) {
    throw new SantaError('INTERNAL', 'O sorteio deste grupo está incompleto. Fale com o organizador.')
  }
  return {
    status: 'drawn' as const,
    wishlist: participant.wishlist,
    receiver: { name: receiver.name, wishlist: receiver.wishlist },
  }
}
```

Observação: o teste de mensagem "15 minutos" depende de `lockedError` calcular os minutos restantes; no instante do 5º erro faltam exatamente 15, e 14 minutos depois (às 12:14) faltam 1 minuto (o teste só confere o código nessa chamada).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa && npm run typecheck`
Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
git add functions/secret-santa/src/handler.ts tests/functions
git commit -m "feat(santa): add PIN auth with lockout, wishlist update and reveal" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Function: sorteio (`draw`)

**Files:**
- Modify: `functions/secret-santa/src/handler.ts`
- Test: `tests/functions/secret-santa/handler.draw.test.ts`

**Interfaces:**
- Consumes: `assignSecretFriends` (Task 3); `requireOrganizer`, `requireOpen`, `requireGroup` (Task 4).
- Produces: ação `draw`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functions/secret-santa/handler.draw.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { createFakeDb } from './fakeDb'

async function errorCode(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function groupWith(names: string[], organizerName?: string) {
  const db = createFakeDb()
  const { groupId, adminToken } = (await handleAction(db, {
    action: 'createGroup',
    name: 'Turma',
    ...(organizerName ? { organizer: { name: organizerName, pin: '9999' } } : {}),
  })) as { groupId: string; adminToken: string }
  for (const [i, name] of names.entries()) {
    await handleAction(db, { action: 'join', groupId, name, pin: `${1000 + i}` })
  }
  return { db, groupId, adminToken }
}

describe('draw', () => {
  it('exige o token do organizador', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken: 'errado' }))).toBe('FORBIDDEN')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('exige 3 ou mais participantes, também depois de remoções', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'C' })
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('NOT_ENOUGH_PARTICIPANTS')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('com exatamente 3 pessoas, sorteia sem ninguém tirar a si mesmo e fecha o grupo', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    for (const row of rows) {
      expect(row.assignedToId).not.toBeNull()
      expect(row.assignedToId).not.toBe(row.id)
    }
    expect(new Set(rows.map((r) => r.assignedToId)).size).toBe(3)
  })

  it('cada pessoa vê só o próprio par, e o organizador que participa também', async () => {
    const { db, groupId, adminToken } = await groupWith(['Ana', 'Bia'], 'Lia')
    await handleAction(db, { action: 'draw', groupId, adminToken })
    const names = ['Ana', 'Bia', 'Lia']
    const pins: Record<string, string> = { Ana: '1000', Bia: '1001', Lia: '9999' }
    const received: string[] = []
    for (const name of names) {
      const result = (await handleAction(db, { action: 'reveal', groupId, name, pin: pins[name] })) as {
        status: string
        receiver: { name: string }
      }
      expect(result.status).toBe('drawn')
      expect(result.receiver.name).not.toBe(name)
      expect(Object.keys(result).sort()).toEqual(['receiver', 'status', 'wishlist'])
      received.push(result.receiver.name)
    }
    expect(new Set(received).size).toBe(3)
  })

  it('não pode ser feito duas vezes nem aceitar entradas depois', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('GROUP_CLOSED')
    expect(await errorCode(handleAction(db, { action: 'join', groupId, name: 'D', pin: '5555' }))).toBe('GROUP_CLOSED')
  })

  it('se falhar no meio da gravação, volta para open e permite tentar de novo', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('INTERNAL')
    expect(db.groups.get(groupId)!.status).toBe('open')

    db.failUpdateParticipantAfter(1000)
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    expect(rows.every((r) => r.assignedToId !== null && r.assignedToId !== r.id)).toBe(true)
  })

  it('uma tentativa que falhou não deixa pares incompletos visíveis em reveal', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))
    const result = await handleAction(db, { action: 'reveal', groupId, name: 'A', pin: '1000' })
    expect(result).toEqual({ status: 'open', wishlist: '' })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/handler.draw.test.ts`
Expected: FAIL (`Ação desconhecida` para `draw`).

- [ ] **Step 3: Implementar**

Em `functions/secret-santa/src/handler.ts`, adicionar `import { assignSecretFriends } from './lib/draw.js'`. No `switch`, antes do `default`, acrescentar:

```ts
    case 'draw':
      return draw(db, input, deps)
```

Ao final do arquivo:

```ts
/**
 * Sorteia o grupo. Passa por `drawing` (que bloqueia novas entradas) e termina em `drawn`.
 * Se algo falhar na gravação, volta para `open` e o organizador pode tentar de novo.
 */
async function draw(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, input.adminToken)
  requireOpen(group)

  const participants = await db.listParticipants(group.id)
  const assignments = assignSecretFriends(
    participants.map((p) => p.id),
    deps.randomInt,
  )

  await db.setGroupStatus(group.id, 'drawing')
  try {
    for (const [giverId, receiverId] of assignments) {
      await db.updateParticipant(giverId, { assignedToId: receiverId })
    }
    await db.setGroupStatus(group.id, 'drawn')
  } catch {
    // Desfaz o estado intermediário: `reveal` só revela com o grupo em `drawn`.
    await db.setGroupStatus(group.id, 'open')
    throw new SantaError('INTERNAL', 'Não foi possível concluir o sorteio. Tente de novo.')
  }
  return {}
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/functions/secret-santa && npm run typecheck`
Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
git add functions/secret-santa/src/handler.ts tests/functions
git commit -m "feat(santa): add draw action with rollback on failure" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Function: adaptador Appwrite, entrada `main` e build

**Files:**
- Create: `functions/secret-santa/src/appwriteDb.ts`, `functions/secret-santa/src/main.ts`
- Test: `tests/functions/secret-santa/main.test.ts` (testa o entrypoint com um banco injetado)

**Interfaces:**
- Consumes: `SantaDb` (Task 4), `handleAction` (Tasks 4 a 6), `SantaError` (Task 1).
- Produces:
  - `createAppwriteDb(env: Record<string, string | undefined>): SantaDb`
  - `createEntrypoint(getDb: () => SantaDb): (context: FunctionContext) => Promise<unknown>` e o `export default` de `main.ts` (usa `createAppwriteDb(process.env)`)
  - `interface FunctionContext { req: { method: string; bodyJson?: unknown; bodyText?: string }; res: { json(body: unknown, status?: number): unknown }; error(message: string): void }`

- [ ] **Step 1: Escrever o teste que falha**

`tests/functions/secret-santa/main.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { createEntrypoint, type FunctionContext } from '../../../functions/secret-santa/src/entrypoint'
import { createFakeDb } from './fakeDb'

function makeContext(overrides: Partial<FunctionContext['req']>) {
  const calls: { body: unknown; status?: number }[] = []
  const errors: string[] = []
  const context: FunctionContext = {
    req: { method: 'POST', ...overrides },
    res: {
      json(body, status) {
        calls.push({ body, status })
        return body
      },
    },
    error: (message) => errors.push(message),
  }
  return { context, calls, errors }
}

describe('entrypoint', () => {
  const run = createEntrypoint(() => createFakeDb())

  it('responde ok com os dados da ação', async () => {
    const { context, calls } = makeContext({ bodyJson: { action: 'createGroup', name: 'Turma' } })
    await run(context)
    expect(calls[0].status).toBeUndefined()
    expect(calls[0].body).toMatchObject({ ok: true, data: { groupId: expect.any(String), adminToken: expect.any(String) } })
  })

  it('lê o corpo de bodyText quando bodyJson não vem', async () => {
    const { context, calls } = makeContext({ bodyText: JSON.stringify({ action: 'createGroup', name: 'Turma' }) })
    await run(context)
    expect(calls[0].body).toMatchObject({ ok: true })
  })

  it('devolve erros esperados com código, mensagem em português e status', async () => {
    const { context, calls } = makeContext({ bodyJson: { action: 'getGroup', groupId: 'naoexiste' } })
    await run(context)
    expect(calls[0].status).toBe(404)
    expect(calls[0].body).toEqual({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Grupo não encontrado.' } })
  })

  it('recusa métodos diferentes de POST', async () => {
    const { context, calls } = makeContext({ method: 'GET' })
    await run(context)
    expect(calls[0].status).toBe(405)
  })

  it('recusa corpo que não é JSON', async () => {
    const { context, calls } = makeContext({ bodyText: '{ quebrado' })
    await run(context)
    expect(calls[0].status).toBe(400)
    expect((calls[0].body as { error: { code: string } }).error.code).toBe('INVALID_INPUT')
  })

  it('erro inesperado vira INTERNAL, sem vazar detalhes, e é registrado', async () => {
    const broken = createEntrypoint(() => {
      throw new Error('chave secreta no erro')
    })
    const { context, calls, errors } = makeContext({ bodyJson: { action: 'getGroup', groupId: 'abc' } })
    await broken(context)
    expect(calls[0].status).toBe(500)
    expect(JSON.stringify(calls[0].body)).not.toContain('chave secreta')
    expect(errors[0]).toContain('chave secreta')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/functions/secret-santa/main.test.ts`
Expected: FAIL (`entrypoint` inexistente).

- [ ] **Step 3: Implementar entrypoint, adaptador e main**

`functions/secret-santa/src/entrypoint.ts`:
```ts
import { handleAction } from './handler.js'
import { SantaError } from './lib/errors.js'
import type { SantaDb } from './types.js'

/** Parte do contexto da Appwrite Function que usamos. */
export interface FunctionContext {
  req: { method: string; bodyJson?: unknown; bodyText?: string }
  res: { json(body: unknown, status?: number): unknown }
  error(message: string): void
}

/** Monta a função exportada pela Appwrite, recebendo uma fábrica do banco (injetável nos testes). */
export function createEntrypoint(getDb: () => SantaDb) {
  return async ({ req, res, error }: FunctionContext): Promise<unknown> => {
    if (req.method !== 'POST') {
      return res.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Use o método POST.' } }, 405)
    }

    let body: unknown = req.bodyJson
    if (body === undefined || body === '') {
      try {
        body = JSON.parse(req.bodyText || '{}')
      } catch {
        return res.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'O corpo precisa ser JSON.' } }, 400)
      }
    }

    try {
      const data = await handleAction(getDb(), body)
      return res.json({ ok: true, data })
    } catch (caught) {
      if (caught instanceof SantaError) {
        return res.json({ ok: false, error: { code: caught.code, message: caught.message } }, caught.status)
      }
      error(String(caught))
      return res.json(
        { ok: false, error: { code: 'INTERNAL', message: 'Algo deu errado. Tente novamente em instantes.' } },
        500,
      )
    }
  }
}
```

`functions/secret-santa/src/appwriteDb.ts`:
```ts
import { Client, ID, Query, TablesDB } from 'node-appwrite'
import { SantaError } from './lib/errors.js'
import type { GroupRow, GroupStatus, ParticipantRow, SantaDb } from './types.js'

type Env = Record<string, string | undefined>

/** Lê a configuração: variáveis da Function com fallback para as que a Appwrite injeta. */
function readConfig(env: Env) {
  const endpoint = env.APPWRITE_ENDPOINT || env.APPWRITE_FUNCTION_API_ENDPOINT
  const projectId = env.APPWRITE_PROJECT_ID || env.APPWRITE_FUNCTION_PROJECT_ID
  const apiKey = env.APPWRITE_API_KEY
  const databaseId = env.SANTA_DATABASE_ID
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    throw new Error('Faltam variáveis: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, SANTA_DATABASE_ID.')
  }
  return {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    groupsTableId: env.SANTA_GROUPS_TABLE_ID || 'santa_groups',
    participantsTableId: env.SANTA_PARTICIPANTS_TABLE_ID || 'santa_participants',
  }
}

/** Banco real, sobre o Appwrite TablesDB com chave de servidor. */
export function createAppwriteDb(env: Env): SantaDb {
  const config = readConfig(env)
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
  const tables = new TablesDB(client)
  const { databaseId, groupsTableId, participantsTableId } = config

  const toGroup = (row: Record<string, any>): GroupRow => ({
    id: row.$id,
    name: row.name,
    budget: row.budget ?? '',
    eventDate: row.eventDate ?? '',
    organizerTokenHash: row.organizerTokenHash,
    status: row.status as GroupStatus,
  })

  const toParticipant = (row: Record<string, any>): ParticipantRow => ({
    id: row.$id,
    groupId: row.groupId,
    name: row.name,
    nameKey: row.nameKey,
    wishlist: row.wishlist ?? '',
    pinHash: row.pinHash,
    failedAttempts: row.failedAttempts ?? 0,
    lockedUntil: row.lockedUntil ? new Date(row.lockedUntil).toISOString() : null,
    assignedToId: row.assignedToId ?? null,
    isOrganizer: Boolean(row.isOrganizer),
  })

  return {
    async createGroup(group) {
      const row = await tables.createRow({
        databaseId,
        tableId: groupsTableId,
        rowId: ID.unique(),
        data: { ...group, createdAt: new Date().toISOString() },
      })
      return row.$id
    },
    async getGroup(id) {
      try {
        return toGroup(await tables.getRow({ databaseId, tableId: groupsTableId, rowId: id }))
      } catch (error) {
        if ((error as { code?: number }).code === 404) return null
        throw error
      }
    },
    async setGroupStatus(id, status) {
      await tables.updateRow({ databaseId, tableId: groupsTableId, rowId: id, data: { status } })
    },
    async createParticipant(participant) {
      try {
        const row = await tables.createRow({
          databaseId,
          tableId: participantsTableId,
          rowId: ID.unique(),
          data: participant,
        })
        return row.$id
      } catch (error) {
        // O índice único (groupId, nameKey) responde 409 quando duas entradas disputam o mesmo nome.
        if ((error as { code?: number }).code === 409) {
          throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
        }
        throw error
      }
    },
    async listParticipants(groupId) {
      const result = await tables.listRows({
        databaseId,
        tableId: participantsTableId,
        queries: [Query.equal('groupId', [groupId]), Query.limit(100)],
      })
      return result.rows.map(toParticipant)
    },
    async updateParticipant(id, patch) {
      await tables.updateRow({ databaseId, tableId: participantsTableId, rowId: id, data: patch })
    },
    async deleteParticipant(id) {
      await tables.deleteRow({ databaseId, tableId: participantsTableId, rowId: id })
    },
  }
}
```

`functions/secret-santa/src/main.ts`:
```ts
import { createAppwriteDb } from './appwriteDb.js'
import { createEntrypoint } from './entrypoint.js'

// Entrada da Appwrite Function: cria o banco real a cada execução, a partir das variáveis de ambiente.
export default createEntrypoint(() => createAppwriteDb(process.env))
```

- [ ] **Step 4: Rodar os testes e o build da Function**

Run: `npx vitest run tests/functions/secret-santa/main.test.ts && npm run typecheck && cd functions/secret-santa && npm run build && ls dist && cd ../..`
Expected: testes passando; typecheck da raiz sem erros; build da Function gera `dist/main.js`. Se o build reclamar das assinaturas de `createRow`/`getRow`/`listRows`/`updateRow`/`deleteRow` na versão instalada do `node-appwrite`, ajustar o adaptador conforme os tipos dessa versão, mantendo a interface `SantaDb` intacta.

- [ ] **Step 5: Commit**

```bash
git add functions/secret-santa/src tests/functions
git commit -m "feat(santa): add Appwrite adapter and function entrypoint" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Provisionar o Appwrite e publicar a Function

**Files:**
- Create: `functions/secret-santa/README.md` (como publicar e quais variáveis definir)

**Interfaces:**
- Consumes: build da Function (Task 7); MCP do Appwrite (`appwrite_search_tools` / `appwrite_call_tool`, escrita com `confirm_write: true`).
- Produces: tabelas `santa_groups` e `santa_participants`; Function com id `secret-santa` (execução para `any`); `VITE_APPWRITE_SANTA_FUNCTION_ID=secret-santa` para o front.

Esta tarefa escreve no Appwrite real da usuária. Antes de cada chamada de escrita, confirmar na conversa que a usuária autorizou o provisionamento (a autorização para o plano inteiro não cobre ações que alteram o servidor dela).

- [ ] **Step 1: Descobrir as ferramentas do MCP**

Usar `appwrite_get_context` e `appwrite_search_tools` (consultas: "create table", "create column string", "create column integer", "create column boolean", "create column datetime", "create index", "create function", "create function variable", "create deployment") para obter os nomes e parâmetros exatos. Listar o banco existente e usar o mesmo banco do sorteador.

- [ ] **Step 2: Criar a tabela `santa_groups`** (sem permissões para `any`; segurança por tabela, não por linha)

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `name` | string | 80 | sim |
| `budget` | string | 40 | não |
| `eventDate` | string | 10 | não |
| `organizerTokenHash` | string | 64 | sim |
| `status` | string | 10 | sim |
| `createdAt` | datetime | | não |

- [ ] **Step 3: Criar a tabela `santa_participants`** (sem permissões para `any`)

| Coluna | Tipo | Tamanho | Obrigatória |
|---|---|---|---|
| `groupId` | string | 36 | sim |
| `name` | string | 60 | sim |
| `nameKey` | string | 60 | sim |
| `wishlist` | string | 500 | não |
| `pinHash` | string | 200 | sim |
| `failedAttempts` | integer | | sim (padrão 0) |
| `lockedUntil` | datetime | | não |
| `assignedToId` | string | 36 | não |
| `isOrganizer` | boolean | | sim (padrão false) |

Índices: `idx_group` (chave) em `groupId`; `uniq_group_name` (único) em `groupId` + `nameKey`.

- [ ] **Step 4: Criar a Function**

Id `secret-santa`, nome "Amigo secreto", runtime `node-22` (conferir os runtimes disponíveis no servidor, que é a versão 1.8.1; se `node-22` não existir, usar o mais novo de Node), `execute: ["any"]`, entrypoint `dist/main.js`, comandos de build `npm install && npm run build`, timeout 15 segundos.

Variáveis da Function: `APPWRITE_API_KEY` (uma chave **nova**, só com os escopos `databases.read`, `databases.write`, `tables.read`, `tables.write`, `rows.read`, `rows.write`; a usuária cria e informa o valor direto no console, nunca no chat), `SANTA_DATABASE_ID`, `SANTA_GROUPS_TABLE_ID=santa_groups`, `SANTA_PARTICIPANTS_TABLE_ID=santa_participants`. As variáveis `APPWRITE_ENDPOINT` e `APPWRITE_PROJECT_ID` são opcionais (a Appwrite injeta equivalentes).

- [ ] **Step 5: Publicar o código**

Se o MCP não expõe upload de código, usar a CLI do Appwrite a partir da raiz (verificar o comando exato com `--help` antes):

Run: `npx appwrite-cli functions create-deployment --help`
Depois publicar a pasta `functions/secret-santa` (código-fonte, não `dist`) com entrypoint `dist/main.js`, comandos `npm install && npm run build` e `--activate true`. A CLI precisa estar autenticada com endpoint, projeto e chave (variáveis `APPWRITE_*` do ambiente da usuária).
Expected: deployment em estado `ready`. Se o build falhar, ler os logs do deployment e corrigir.

- [ ] **Step 6: Teste de fumaça com execuções reais**

Pelo MCP (ou CLI) executar a Function com `POST` e corpo JSON, conferindo cada resposta:
1. `{"action":"createGroup","name":"Teste","organizer":{"name":"Eu","pin":"1234"}}` devolve `ok: true`, `groupId` e `adminToken`.
2. `{"action":"getGroup","groupId":"<id>"}` devolve `participantCount: 1`.
3. `{"action":"reveal","groupId":"<id>","name":"eu","pin":"0000"}` devolve `BAD_CREDENTIALS`.
4. `{"action":"getGroup","groupId":"naoexiste"}` devolve `GROUP_NOT_FOUND`.
5. Conferir no banco que `pinHash` e `organizerTokenHash` não contêm o PIN nem o token em texto.

Depois apagar o grupo e o participante de teste (com a chave de servidor), para não deixar lixo. Registrar o resultado de cada item no relatório final; um item que não puder ser executado deve ser dito como **não verificado**.

- [ ] **Step 7: Documentar e commitar**

`functions/secret-santa/README.md` deve listar: tabelas e colunas (as acima), índices, variáveis da Function, permissão `execute: any`, comando de publicação usado e o aviso de que a chave de API da Function deve ter só os escopos de banco.

```bash
git add functions/secret-santa/README.md
git commit -m "docs(santa): document Appwrite provisioning and deployment" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Front: serviço Appwrite com Functions e cliente da Function

**Files:**
- Modify: `src/core/services/appwrite.ts`, `src/env.d.ts`, `tests/core/services/appwrite.test.ts`
- Create: `src/modules/secret-santa/lib/api.ts`
- Test: `tests/modules/secret-santa/lib/api.test.ts`

**Interfaces:**
- Consumes: `getAppwrite`, `AppwriteConfigError` (Task 5 do plano anterior, já existentes).
- Produces:
  - `getAppwrite()` passa a devolver `{ client, tablesDB, functions }` (`functions: Functions` do SDK web); `getSantaFunctionId(): string` (lança `AppwriteConfigError` se `VITE_APPWRITE_SANTA_FUNCTION_ID` faltar)
  - `type SantaApiErrorCode = 'INVALID_INPUT' | 'GROUP_NOT_FOUND' | 'GROUP_CLOSED' | 'NAME_TAKEN' | 'BAD_CREDENTIALS' | 'LOCKED' | 'NOT_ENOUGH_PARTICIPANTS' | 'FORBIDDEN' | 'INTERNAL' | 'NETWORK' | 'CONFIG'`
  - `class SantaApiError extends Error { readonly code: SantaApiErrorCode }`
  - `type Execute = (body: string) => Promise<{ responseStatusCode: number; responseBody: string }>`
  - `callSanta<T>(action: string, params: Record<string, unknown>, execute?: Execute): Promise<T>`
  - Funções tipadas: `createGroup`, `getGroup`, `joinGroup`, `updateWishlist`, `listParticipants`, `removeParticipant`, `drawGroup`, `revealMatch` (assinaturas abaixo)

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `tests/core/services/appwrite.test.ts`:
```ts
import { getSantaFunctionId } from '@/core/services/appwrite'

describe('getAppwrite (functions)', () => {
  it('expõe o serviço Functions', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(typeof getAppwrite().functions.createExecution).toBe('function')
  })
})

describe('getSantaFunctionId', () => {
  it('lança AppwriteConfigError quando faltar a variável', () => {
    vi.stubEnv('VITE_APPWRITE_SANTA_FUNCTION_ID', '')
    expect(() => getSantaFunctionId()).toThrow(AppwriteConfigError)
  })

  it('devolve o id configurado', () => {
    vi.stubEnv('VITE_APPWRITE_SANTA_FUNCTION_ID', 'secret-santa')
    expect(getSantaFunctionId()).toBe('secret-santa')
  })
})
```
(ajustar o `import` do topo do arquivo para incluir `getSantaFunctionId` no mesmo import existente em vez de duplicar).

`tests/modules/secret-santa/lib/api.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { AppwriteConfigError } from '@/core/services/appwrite'
import {
  callSanta,
  createGroup,
  revealMatch,
  SantaApiError,
  type Execute,
} from '@/modules/secret-santa/lib/api'

function respond(body: unknown, status = 200): Execute {
  return async () => ({ responseStatusCode: status, responseBody: JSON.stringify(body) })
}

describe('callSanta', () => {
  it('envia a ação e os parâmetros como JSON e devolve os dados', async () => {
    let sent = ''
    const execute: Execute = async (body) => {
      sent = body
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: { groupId: 'g1' } }) }
    }
    const data = await callSanta<{ groupId: string }>('createGroup', { name: 'Turma' }, execute)
    expect(JSON.parse(sent)).toEqual({ action: 'createGroup', name: 'Turma' })
    expect(data.groupId).toBe('g1')
  })

  it('converte erros da Function em SantaApiError com código e mensagem', async () => {
    const execute = respond({ ok: false, error: { code: 'NAME_TAKEN', message: 'Nome repetido.' } }, 409)
    await expect(callSanta('join', {}, execute)).rejects.toMatchObject({ code: 'NAME_TAKEN', message: 'Nome repetido.' })
    await expect(callSanta('join', {}, execute)).rejects.toBeInstanceOf(SantaApiError)
  })

  it('converte falha de rede em NETWORK', async () => {
    const execute: Execute = async () => {
      throw new Error('offline')
    }
    await expect(callSanta('getGroup', {}, execute)).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('converte AppwriteConfigError em CONFIG', async () => {
    const execute: Execute = async () => {
      throw new AppwriteConfigError('faltam variáveis')
    }
    await expect(callSanta('getGroup', {}, execute)).rejects.toMatchObject({ code: 'CONFIG' })
  })

  it('converte resposta que não é JSON em NETWORK com mensagem amigável', async () => {
    const execute: Execute = async () => ({ responseStatusCode: 502, responseBody: '<html>erro</html>' })
    const error = await callSanta('getGroup', {}, execute).catch((e) => e)
    expect(error.code).toBe('NETWORK')
    expect(error.message).toMatch(/servidor/i)
  })
})

describe('funções tipadas', () => {
  it('createGroup envia organizador só quando informado', async () => {
    let sent: Record<string, unknown> = {}
    const execute: Execute = async (body) => {
      sent = JSON.parse(body)
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: { groupId: 'g', adminToken: 't' } }) }
    }
    await createGroup({ name: 'Turma', budget: '', eventDate: '' }, execute)
    expect(sent.organizer).toBeUndefined()
    await createGroup({ name: 'Turma', organizer: { name: 'Lia', pin: '1234', wishlist: '' } }, execute)
    expect(sent.organizer).toEqual({ name: 'Lia', pin: '1234', wishlist: '' })
  })

  it('revealMatch devolve o par quando sorteado', async () => {
    const execute = respond({
      ok: true,
      data: { status: 'drawn', wishlist: 'x', receiver: { name: 'Ana', wishlist: 'y' } },
    })
    const result = await revealMatch({ groupId: 'g', name: 'João', pin: '1234' }, execute)
    expect(result).toEqual({ status: 'drawn', wishlist: 'x', receiver: { name: 'Ana', wishlist: 'y' } })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/core/services tests/modules/secret-santa/lib/api.test.ts`
Expected: FAIL (`getSantaFunctionId`, `functions` e `api` inexistentes).

- [ ] **Step 3: Implementar**

Em `src/core/services/appwrite.ts`: importar `Functions` de `appwrite` (junto de `Client, TablesDB`), trocar o tipo e a criação da instância por `{ client: Client; tablesDB: TablesDB; functions: Functions }` e `instance = { client, tablesDB: new TablesDB(client), functions: new Functions(client) }`, e acrescentar:

```ts
/** Id da Function do amigo secreto. */
export function getSantaFunctionId(): string {
  const functionId = import.meta.env.VITE_APPWRITE_SANTA_FUNCTION_ID
  if (!functionId) {
    throw new AppwriteConfigError('O Appwrite não está configurado. Defina VITE_APPWRITE_SANTA_FUNCTION_ID.')
  }
  return functionId
}
```

Em `src/env.d.ts`, acrescentar `readonly VITE_APPWRITE_SANTA_FUNCTION_ID: string` ao `ImportMetaEnv`.

`src/modules/secret-santa/lib/api.ts`:
```ts
import { ExecutionMethod } from 'appwrite'
import { AppwriteConfigError, getAppwrite, getSantaFunctionId } from '@/core/services/appwrite'

export type SantaApiErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
  | 'BAD_CREDENTIALS'
  | 'LOCKED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'FORBIDDEN'
  | 'INTERNAL'
  | 'NETWORK'
  | 'CONFIG'

export class SantaApiError extends Error {
  constructor(
    public readonly code: SantaApiErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SantaApiError'
  }
}

export type Execute = (body: string) => Promise<{ responseStatusCode: number; responseBody: string }>

/** Execução real: chama a Function do amigo secreto pelo SDK web do Appwrite. */
const executeOnAppwrite: Execute = async (body) => {
  const { functions } = getAppwrite()
  const execution = await functions.createExecution({
    functionId: getSantaFunctionId(),
    body,
    async: false,
    method: ExecutionMethod.POST,
  })
  return { responseStatusCode: execution.responseStatusCode, responseBody: execution.responseBody }
}

const NETWORK_MESSAGE = 'Não foi possível falar com o servidor. Tente novamente em instantes.'

/** Chama uma ação da Function e devolve os dados, ou lança SantaApiError com mensagem em português. */
export async function callSanta<T>(
  action: string,
  params: Record<string, unknown>,
  execute: Execute = executeOnAppwrite,
): Promise<T> {
  let result: { responseStatusCode: number; responseBody: string }
  try {
    result = await execute(JSON.stringify({ action, ...params }))
  } catch (error) {
    if (error instanceof AppwriteConfigError) {
      throw new SantaApiError('CONFIG', 'O amigo secreto ainda não está configurado neste site.')
    }
    throw new SantaApiError('NETWORK', NETWORK_MESSAGE)
  }

  let parsed: { ok: boolean; data?: T; error?: { code: SantaApiErrorCode; message: string } }
  try {
    parsed = JSON.parse(result.responseBody)
  } catch {
    throw new SantaApiError('NETWORK', NETWORK_MESSAGE)
  }

  if (parsed.ok) return parsed.data as T
  throw new SantaApiError(parsed.error?.code ?? 'INTERNAL', parsed.error?.message ?? NETWORK_MESSAGE)
}

export interface Credentials {
  groupId: string
  name: string
  pin: string
}

export interface GroupInfo {
  name: string
  budget: string
  eventDate: string
  status: 'open' | 'drawing' | 'drawn'
  participantCount: number
}

export type RevealResult =
  | { status: 'open'; wishlist: string }
  | { status: 'drawn'; wishlist: string; receiver: { name: string; wishlist: string } }

export function createGroup(
  input: {
    name: string
    budget?: string
    eventDate?: string
    organizer?: { name: string; pin: string; wishlist?: string }
  },
  execute?: Execute,
) {
  return callSanta<{ groupId: string; adminToken: string }>('createGroup', { ...input }, execute)
}

export function getGroup(groupId: string, execute?: Execute) {
  return callSanta<GroupInfo>('getGroup', { groupId }, execute)
}

export function joinGroup(input: Credentials & { wishlist?: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('join', { ...input }, execute)
}

export function updateWishlist(input: Credentials & { wishlist: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('updateWishlist', { ...input }, execute)
}

export function listParticipants(input: { groupId: string; adminToken: string }, execute?: Execute) {
  return callSanta<{ status: GroupInfo['status']; participants: { name: string; isOrganizer: boolean }[] }>(
    'listParticipants',
    { ...input },
    execute,
  )
}

export function removeParticipant(input: { groupId: string; adminToken: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('removeParticipant', { ...input }, execute)
}

export function drawGroup(input: { groupId: string; adminToken: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('draw', { ...input }, execute)
}

export function revealMatch(input: Credentials, execute?: Execute) {
  return callSanta<RevealResult>('reveal', { ...input }, execute)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: todos passando. Se o SDK instalado tiver assinatura diferente para `createExecution`/`ExecutionMethod`, ajustar apenas `executeOnAppwrite`.

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat(santa): add Appwrite Functions service and typed API client" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Front: sessão, links e revelação temporária

**Files:**
- Create: `src/modules/secret-santa/lib/session.ts`, `src/modules/secret-santa/lib/links.ts`, `src/modules/secret-santa/composables/useReveal.ts`
- Test: `tests/modules/secret-santa/lib/session.test.ts`, `tests/modules/secret-santa/lib/links.test.ts`, `tests/modules/secret-santa/composables/useReveal.test.ts`

**Interfaces:**
- Produces:
  - `saveCredentials(groupId, { name, pin })`, `loadCredentials(groupId): { name: string; pin: string } | null`, `clearCredentials(groupId)` (somente `sessionStorage`)
  - `saveAdminToken(groupId, token)`, `loadAdminToken(groupId): string | null` (`localStorage`)
  - `inviteUrl(origin, groupId)`, `adminUrl(origin, groupId, token)`, `meUrl`-path helpers: `invitePath(groupId)`, `mePath(groupId)`, `adminPath(groupId)`, `whatsappUrl(groupName, inviteLink)`
  - `useReveal(autoHideMs = 15000): { revealed: Ref<boolean>; reveal(): void; hide(): void }`

- [ ] **Step 1: Escrever os testes que falham**

`tests/modules/secret-santa/lib/session.test.ts`:
```ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearCredentials,
  loadAdminToken,
  loadCredentials,
  saveAdminToken,
  saveCredentials,
} from '@/modules/secret-santa/lib/session'

afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('credenciais da sessão', () => {
  it('guarda e lê nome e PIN por grupo, só em sessionStorage', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    expect(loadCredentials('g1')).toEqual({ name: 'Ana', pin: '1234' })
    expect(loadCredentials('g2')).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('o PIN nunca vai para o localStorage', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    saveAdminToken('g1', 'tok')
    expect(JSON.stringify({ ...localStorage })).not.toContain('1234')
  })

  it('limpa as credenciais', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    clearCredentials('g1')
    expect(loadCredentials('g1')).toBeNull()
  })

  it('ignora valor corrompido', () => {
    sessionStorage.setItem('santa:cred:g1', '{ quebrado')
    expect(loadCredentials('g1')).toBeNull()
  })
})

describe('token do organizador', () => {
  it('guarda e lê em localStorage', () => {
    saveAdminToken('g1', 'tok')
    expect(loadAdminToken('g1')).toBe('tok')
    expect(loadAdminToken('g2')).toBeNull()
  })
})
```

`tests/modules/secret-santa/lib/links.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { adminUrl, inviteUrl, whatsappUrl } from '@/modules/secret-santa/lib/links'

describe('links', () => {
  it('monta o link de convite', () => {
    expect(inviteUrl('https://x.com', 'abc')).toBe('https://x.com/secret-santa/g/abc')
  })

  it('põe o token do organizador no fragmento, nunca na query', () => {
    const url = adminUrl('https://x.com', 'abc', 'tok-1')
    expect(url).toBe('https://x.com/secret-santa/g/abc/admin#t=tok-1')
    expect(url).not.toContain('?')
  })

  it('monta o link do WhatsApp com texto codificado', () => {
    const url = whatsappUrl('Família & Cia', 'https://x.com/secret-santa/g/abc')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length))
    expect(text).toContain('Família & Cia')
    expect(text).toContain('https://x.com/secret-santa/g/abc')
  })
})
```

`tests/modules/secret-santa/composables/useReveal.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReveal } from '@/modules/secret-santa/composables/useReveal'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useReveal', () => {
  it('começa escondido, revela e esconde manualmente', () => {
    const { revealed, reveal, hide } = useReveal()
    expect(revealed.value).toBe(false)
    reveal()
    expect(revealed.value).toBe(true)
    hide()
    expect(revealed.value).toBe(false)
  })

  it('esconde sozinho depois de 15 segundos', () => {
    const { revealed, reveal } = useReveal()
    reveal()
    vi.advanceTimersByTime(14_999)
    expect(revealed.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(revealed.value).toBe(false)
  })

  it('revelar de novo reinicia a contagem', () => {
    const { revealed, reveal } = useReveal(1000)
    reveal()
    vi.advanceTimersByTime(800)
    reveal()
    vi.advanceTimersByTime(800)
    expect(revealed.value).toBe(true)
    vi.advanceTimersByTime(200)
    expect(revealed.value).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/modules/secret-santa`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar**

`src/modules/secret-santa/lib/session.ts`:
```ts
export interface SessionCredentials {
  name: string
  pin: string
}

const credKey = (groupId: string) => `santa:cred:${groupId}`
const adminKey = (groupId: string) => `santa:admin:${groupId}`

/** Guarda nome e PIN só na sessão da aba (some ao fechar). O PIN nunca vai para o localStorage. */
export function saveCredentials(groupId: string, credentials: SessionCredentials): void {
  try {
    sessionStorage.setItem(credKey(groupId), JSON.stringify(credentials))
  } catch {
    // Storage indisponível: a pessoa precisará entrar de novo ao recarregar.
  }
}

export function loadCredentials(groupId: string): SessionCredentials | null {
  try {
    const raw = sessionStorage.getItem(credKey(groupId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.name === 'string' && typeof parsed?.pin === 'string') return parsed
  } catch {
    // Valor corrompido ou storage indisponível.
  }
  return null
}

export function clearCredentials(groupId: string): void {
  try {
    sessionStorage.removeItem(credKey(groupId))
  } catch {
    // Nada a limpar.
  }
}

/** O token do organizador fica no navegador dele (localStorage) para reabrir o painel depois. */
export function saveAdminToken(groupId: string, token: string): void {
  try {
    localStorage.setItem(adminKey(groupId), token)
  } catch {
    // Sem storage: o organizador precisa guardar o link de administração.
  }
}

export function loadAdminToken(groupId: string): string | null {
  try {
    return localStorage.getItem(adminKey(groupId))
  } catch {
    return null
  }
}
```

`src/modules/secret-santa/lib/links.ts`:
```ts
export const invitePath = (groupId: string) => `/secret-santa/g/${groupId}`
export const mePath = (groupId: string) => `/secret-santa/g/${groupId}/me`
export const adminPath = (groupId: string) => `/secret-santa/g/${groupId}/admin`

export function inviteUrl(origin: string, groupId: string): string {
  return `${origin}${invitePath(groupId)}`
}

/** O token vai no fragmento (#), que o navegador não envia ao servidor. */
export function adminUrl(origin: string, groupId: string, token: string): string {
  return `${origin}${adminPath(groupId)}#t=${token}`
}

export function whatsappUrl(groupName: string, inviteLink: string): string {
  const text = `Você foi convidado para o amigo secreto "${groupName}". Entre aqui: ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
```

`src/modules/secret-santa/composables/useReveal.ts`:
```ts
import { getCurrentScope, onScopeDispose, ref } from 'vue'

/** Controla a revelação do nome: aparece ao pedir e se esconde sozinho depois de um tempo. */
export function useReveal(autoHideMs = 15_000) {
  const revealed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function hide() {
    clearTimeout(timer)
    revealed.value = false
  }

  function reveal() {
    clearTimeout(timer)
    revealed.value = true
    timer = setTimeout(hide, autoHideMs)
  }

  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  return { revealed, reveal, hide }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
git add src/modules/secret-santa tests/modules
git commit -m "feat(santa): add session storage, links and timed reveal" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Front: etiqueta de presente, tema do módulo e telas de criar, convite e meu painel

**Files:**
- Modify: `src/style.css` (fonte Nunito e token `--font-display`)
- Create: `src/modules/secret-santa/components/GiftTag.vue`, `src/modules/secret-santa/CreateGroupView.vue`, `src/modules/secret-santa/GroupView.vue`, `src/modules/secret-santa/MeView.vue`, `src/components/ui/dialog/*` (gerado pelo shadcn-vue)
- Test: `tests/modules/secret-santa/components/GiftTag.test.ts`

**Interfaces:**
- Consumes: `api.ts` (Task 9), `session.ts`, `links.ts`, `useReveal` (Task 10).
- Produces: `GiftTag` com props `{ name: string; revealed: boolean }`; `CreateGroupView`, `GroupView`, `MeView`.

Esta tarefa e a seguinte são **design conduzido pelas skills `ui-ux-pro-max` e `frontend-design`**: antes de escrever as telas, reler a seção 9 da spec e conferir cada tela contra o checklist de pré-entrega da skill `ui-ux-pro-max` (contraste 4,5:1, alvos de 44px, foco visível, `prefers-reduced-motion`, sem emoji como ícone, responsivo a 375, 768, 1024 e 1440px). Qualquer ajuste visual vira commit próprio com a justificativa.

- [ ] **Step 1: Adicionar o diálogo do shadcn-vue e a fonte**

Run: `npx shadcn-vue@latest add dialog -y`
Expected: arquivos em `src/components/ui/dialog/`; conferir que os imports de ícones vêm de `@lucide/vue`.

Em `src/style.css`: na linha do `@import url('https://fonts.googleapis.com/...')` acrescentar `&family=Nunito:wght@800` antes de `&display=swap`, e, dentro de `@theme inline { ... }`, acrescentar `--font-display: 'Nunito', ui-sans-serif, system-ui, sans-serif;` (gera a classe `font-display`).

- [ ] **Step 2: Escrever o teste que falha**

`tests/modules/secret-santa/components/GiftTag.test.ts`:
```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GiftTag from '@/modules/secret-santa/components/GiftTag.vue'

describe('GiftTag', () => {
  it('não coloca o nome no DOM enquanto está escondida', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana Souza', revealed: false } })
    expect(wrapper.text()).not.toContain('Ana Souza')
    expect(wrapper.html()).not.toContain('Ana Souza')
  })

  it('mostra o nome quando revelada', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana Souza', revealed: true } })
    expect(wrapper.text()).toContain('Ana Souza')
  })

  it('anuncia a mudança de forma educada para leitores de tela', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: true } })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('volta a esconder o nome', async () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: true } })
    await wrapper.setProps({ revealed: false })
    expect(wrapper.text()).not.toContain('Ana')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/modules/secret-santa/components/GiftTag.test.ts`
Expected: FAIL (`GiftTag.vue` inexistente).

- [ ] **Step 4: Implementar `GiftTag`**

`src/modules/secret-santa/components/GiftTag.vue`:
```vue
<script setup lang="ts">
defineProps<{ name: string; revealed: boolean }>()
</script>

<template>
  <div class="mx-auto w-full max-w-xs [perspective:900px]">
    <!-- O barbante e o furo da etiqueta -->
    <div class="mx-auto h-6 w-1 rounded-full bg-[#3B82F6]" aria-hidden="true" />
    <div
      class="relative h-40 transition-transform duration-300 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
      :class="revealed ? '[transform:rotateY(180deg)] motion-reduce:[transform:none]' : ''"
    >
      <!-- Frente: etiqueta fechada -->
      <div
        class="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#1D4ED8] text-[#E3F2FD] [backface-visibility:hidden] motion-reduce:data-[revealed=true]:hidden"
        :data-revealed="revealed"
        aria-hidden="true"
      >
        <span class="size-4 rounded-full border-2 border-[#E3F2FD]" />
      </div>
      <!-- Verso: o nome, só existe no DOM quando revelado -->
      <div
        class="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-[#1D4ED8] bg-white p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] motion-reduce:[transform:none]"
        :class="revealed ? '' : 'motion-reduce:hidden'"
        aria-live="polite"
      >
        <span v-if="revealed" class="font-display text-3xl leading-tight text-[#1E293B]">{{ name }}</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/modules/secret-santa/components/GiftTag.test.ts`
Expected: 4 testes passando.

- [ ] **Step 6: Implementar `CreateGroupView` (3 passos)**

`src/modules/secret-santa/CreateGroupView.vue`:
```vue
<script setup lang="ts">
import { ArrowLeft, Gift } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createGroup, SantaApiError } from './lib/api'
import { adminPath } from './lib/links'
import { saveAdminToken, saveCredentials } from './lib/session'

const router = useRouter()

const step = ref(1)
const name = ref('')
const budget = ref('')
const eventDate = ref('')
const participates = ref(true)
const myName = ref('')
const myPin = ref('')
const myWishlist = ref('')
const loading = ref(false)
const error = ref('')

const stepTitles = ['Como vai se chamar o grupo?', 'Valor e data (opcionais)', 'Você também participa?']
const canContinue = computed(() => {
  if (step.value === 1) return name.value.trim().length > 0
  if (step.value === 3 && participates.value) return myName.value.trim().length > 0 && /^\d{4,6}$/.test(myPin.value)
  return true
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { groupId, adminToken } = await createGroup({
      name: name.value,
      budget: budget.value,
      eventDate: eventDate.value,
      ...(participates.value
        ? { organizer: { name: myName.value, pin: myPin.value, wishlist: myWishlist.value } }
        : {}),
    })
    saveAdminToken(groupId, adminToken)
    if (participates.value) saveCredentials(groupId, { name: myName.value, pin: myPin.value })
    // O token vai no fragmento: não é enviado ao servidor.
    await router.push({ path: adminPath(groupId), hash: `#t=${adminToken}` })
  } catch (e) {
    error.value = e instanceof SantaApiError ? e.message : 'Não foi possível criar o grupo.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function onNext() {
  if (step.value < 3) step.value += 1
  else onSubmit()
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <header class="space-y-2">
      <Gift class="size-8 text-primary" aria-hidden="true" />
      <h1 class="font-display text-3xl leading-tight">Amigo secreto</h1>
      <p class="text-muted-foreground">Crie o grupo, convide as pessoas e sorteie. Cada uma vê só quem tirou.</p>
    </header>

    <form class="space-y-6" @submit.prevent="onNext">
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">Passo {{ step }} de 3</p>
        <h2 class="font-display text-2xl leading-tight">{{ stepTitles[step - 1] }}</h2>
      </div>

      <div v-if="step === 1" class="space-y-2">
        <Label for="group-name">Nome do grupo</Label>
        <Input id="group-name" v-model="name" maxlength="80" autocomplete="off" placeholder="Família Silva" />
      </div>

      <div v-else-if="step === 2" class="space-y-4">
        <div class="space-y-2">
          <Label for="budget">Valor sugerido</Label>
          <Input id="budget" v-model="budget" maxlength="40" placeholder="R$ 50" />
        </div>
        <div class="space-y-2">
          <Label for="event-date">Data da troca</Label>
          <Input id="event-date" v-model="eventDate" type="date" />
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center gap-3">
          <Switch id="participates" v-model="participates" />
          <Label for="participates">Quero entrar no sorteio</Label>
        </div>
        <template v-if="participates">
          <div class="space-y-2">
            <Label for="my-name">Seu nome</Label>
            <Input id="my-name" v-model="myName" maxlength="60" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <Label for="my-pin">PIN (4 a 6 números)</Label>
            <Input id="my-pin" v-model="myPin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" />
            <p class="text-sm text-muted-foreground">Você usa o PIN para ver quem tirou. Anote, não dá para recuperar.</p>
          </div>
          <div class="space-y-2">
            <Label for="my-wishlist">O que você gostaria de ganhar</Label>
            <Textarea id="my-wishlist" v-model="myWishlist" maxlength="500" rows="3" />
          </div>
        </template>
        <p v-else class="text-sm text-muted-foreground">
          Você organiza o grupo e não entra no sorteio. Mesmo participando, você não vê os pares dos outros.
        </p>
      </div>

      <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

      <div class="flex items-center gap-3">
        <Button v-if="step > 1" type="button" variant="ghost" size="lg" @click="step -= 1">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button type="submit" size="lg" class="flex-1" :disabled="!canContinue || loading">
          {{ step < 3 ? 'Continuar' : loading ? 'Criando...' : 'Criar grupo' }}
        </Button>
      </div>
    </form>
  </section>
</template>
```

- [ ] **Step 7: Implementar `GroupView` (convite: entrar ou voltar)**

`src/modules/secret-santa/GroupView.vue`:
```vue
<script setup lang="ts">
import { CalendarDays, Coins, Users } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getGroup, joinGroup, revealMatch, SantaApiError, type GroupInfo } from './lib/api'
import { mePath } from './lib/links'
import { saveCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'not-found' | 'error'
const state = ref<State>('loading')
const group = ref<GroupInfo | null>(null)
const errorMessage = ref('')

const mode = ref<'join' | 'return'>('join')
const name = ref('')
const pin = ref('')
const wishlist = ref('')
const submitting = ref(false)
const formError = ref('')

onMounted(async () => {
  try {
    group.value = await getGroup(groupId)
    state.value = 'ready'
    if (group.value.status !== 'open') mode.value = 'return'
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'GROUP_NOT_FOUND') {
      state.value = 'not-found'
    } else {
      errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir o grupo.'
      state.value = 'error'
    }
  }
})

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { dateStyle: 'long' })
}

async function onSubmit() {
  formError.value = ''
  submitting.value = true
  try {
    if (mode.value === 'join') {
      await joinGroup({ groupId, name: name.value, pin: pin.value, wishlist: wishlist.value })
      toast.success('Você entrou no grupo!')
    } else {
      // Confere nome e PIN antes de seguir para o painel.
      await revealMatch({ groupId, name: name.value, pin: pin.value })
    }
    saveCredentials(groupId, { name: name.value, pin: pin.value })
    await router.push(mePath(groupId))
  } catch (e) {
    formError.value = e instanceof SantaApiError ? e.message : 'Não foi possível continuar.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo o grupo...</p>

    <div v-else-if="state === 'not-found'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Grupo não encontrado</h1>
      <p class="text-muted-foreground">Confira se o link do convite está completo.</p>
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir o grupo</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </div>

    <template v-else-if="group">
      <header class="space-y-3">
        <h1 class="font-display text-3xl leading-tight">{{ group.name }}</h1>
        <ul class="space-y-1 text-muted-foreground">
          <li class="flex items-center gap-2"><Users class="size-4" aria-hidden="true" />{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</li>
          <li v-if="group.budget" class="flex items-center gap-2"><Coins class="size-4" aria-hidden="true" />{{ group.budget }}</li>
          <li v-if="group.eventDate" class="flex items-center gap-2"><CalendarDays class="size-4" aria-hidden="true" />{{ formatDate(group.eventDate) }}</li>
        </ul>
        <p v-if="group.status !== 'open'" class="rounded-lg bg-primary/10 p-3 text-sm">
          Este grupo já foi sorteado. Entre com seu nome e PIN para ver quem você tirou.
        </p>
      </header>

      <div v-if="group.status === 'open'" class="flex gap-2" role="tablist">
        <Button :variant="mode === 'join' ? 'default' : 'outline'" role="tab" :aria-selected="mode === 'join'" @click="mode = 'join'">Entrar no grupo</Button>
        <Button :variant="mode === 'return' ? 'default' : 'outline'" role="tab" :aria-selected="mode === 'return'" @click="mode = 'return'">Já entrei</Button>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-2">
          <Label for="name">Seu nome</Label>
          <Input id="name" v-model="name" maxlength="60" autocomplete="off" />
        </div>
        <div class="space-y-2">
          <Label for="pin">{{ mode === 'join' ? 'Crie um PIN (4 a 6 números)' : 'Seu PIN' }}</Label>
          <Input id="pin" v-model="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" />
          <p v-if="mode === 'join'" class="text-sm text-muted-foreground">Você vai usar o PIN para ver quem tirou. Anote, não dá para recuperar.</p>
        </div>
        <div v-if="mode === 'join'" class="space-y-2">
          <Label for="wishlist">O que você gostaria de ganhar</Label>
          <Textarea id="wishlist" v-model="wishlist" maxlength="500" rows="3" />
        </div>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <Button type="submit" size="lg" class="w-full" :disabled="submitting || !name.trim() || !/^\d{4,6}$/.test(pin)">
          {{ submitting ? 'Aguarde...' : mode === 'join' ? 'Entrar no grupo' : 'Ver meu painel' }}
        </Button>
      </form>
    </template>
  </section>
</template>
```

- [ ] **Step 8: Implementar `MeView` (painel pessoal e revelação)**

`src/modules/secret-santa/MeView.vue`:
```vue
<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import GiftTag from './components/GiftTag.vue'
import { useReveal } from './composables/useReveal'
import { revealMatch, SantaApiError, updateWishlist, type RevealResult } from './lib/api'
import { invitePath } from './lib/links'
import { clearCredentials, loadCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const result = ref<RevealResult | null>(null)
const wishlist = ref('')
const saving = ref(false)
const { revealed, reveal, hide } = useReveal()

const credentials = loadCredentials(groupId)

onMounted(async () => {
  // Sem credenciais na sessão (aba nova ou recarregada sem storage): volta para a tela de entrada.
  if (!credentials) {
    await router.replace(invitePath(groupId))
    return
  }
  try {
    result.value = await revealMatch({ groupId, ...credentials })
    wishlist.value = result.value.wishlist
    state.value = 'ready'
  } catch (e) {
    if (e instanceof SantaApiError && (e.code === 'BAD_CREDENTIALS' || e.code === 'LOCKED')) {
      clearCredentials(groupId)
      await router.replace(invitePath(groupId))
      return
    }
    errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir seu painel.'
    state.value = 'error'
  }
})

async function onSave() {
  if (!credentials) return
  saving.value = true
  try {
    await updateWishlist({ groupId, ...credentials, wishlist: wishlist.value })
    toast.success('Lista de desejos salva.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo seu painel...</p>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir seu painel</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </div>

    <template v-else-if="result">
      <template v-if="result.status === 'drawn'">
        <header class="space-y-1">
          <h1 class="font-display text-3xl leading-tight">Você tirou</h1>
          <p class="text-muted-foreground">Toque em revelar. O nome some sozinho depois de 15 segundos.</p>
        </header>
        <GiftTag :name="result.receiver.name" :revealed="revealed" />
        <div class="flex justify-center">
          <Button v-if="!revealed" size="lg" @click="reveal">
            <Eye class="size-4" aria-hidden="true" />
            Revelar
          </Button>
          <Button v-else size="lg" variant="outline" @click="hide">
            <EyeOff class="size-4" aria-hidden="true" />
            Esconder
          </Button>
        </div>
        <div v-if="revealed" class="space-y-2">
          <h2 class="font-display text-xl">O que {{ result.receiver.name }} gostaria de ganhar</h2>
          <p class="whitespace-pre-line rounded-lg bg-card p-4">
            {{ result.receiver.wishlist || 'Ainda não escreveu nada.' }}
          </p>
        </div>
      </template>

      <template v-else>
        <header class="space-y-1">
          <h1 class="font-display text-3xl leading-tight">Tudo certo, {{ credentials?.name }}</h1>
          <p class="text-muted-foreground">O sorteio ainda não aconteceu. Quando o organizador sortear, volte aqui para ver quem você tirou.</p>
        </header>
        <form class="space-y-3" @submit.prevent="onSave">
          <Label for="my-wishlist">O que você gostaria de ganhar</Label>
          <Textarea id="my-wishlist" v-model="wishlist" maxlength="500" rows="4" />
          <Button type="submit" size="lg" class="w-full" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar lista' }}</Button>
        </form>
        <Button as-child variant="ghost"><RouterLink :to="invitePath(groupId)">Voltar ao grupo</RouterLink></Button>
      </template>
    </template>
  </section>
</template>
```

- [ ] **Step 9: Verificar**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck sem erros; todos os testes passando. Se `Gift`, `Users`, `Coins`, `CalendarDays`, `Eye`, `EyeOff`, `ArrowLeft` não existirem em `@lucide/vue` com esses nomes, usar o equivalente da biblioteca, mantendo o import de `@lucide/vue`.

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "feat(santa): add gift tag, create, invite and personal views" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Front: painel do organizador, manifest e documentação

**Files:**
- Create: `src/modules/secret-santa/AdminView.vue`, `src/modules/secret-santa/manifest.ts`
- Modify: `README.md`
- Test: `tests/modules/secret-santa/manifest.test.ts`

**Interfaces:**
- Consumes: `api.ts`, `session.ts`, `links.ts` (Tasks 9 e 10); `Dialog` do shadcn-vue (Task 11).
- Produces: módulo `secret-santa` registrado no hub (rotas `/secret-santa`, `/secret-santa/g/:id`, `/secret-santa/g/:id/me`, `/secret-santa/g/:id/admin`).

- [ ] **Step 1: Escrever o teste que falha**

`tests/modules/secret-santa/manifest.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { tools } from '@/core/modules/registry'

describe('módulo secret-santa', () => {
  const santa = tools.find((tool) => tool.id === 'secret-santa')

  it('é descoberto automaticamente pelo registro', () => {
    expect(santa).toBeDefined()
    expect(santa?.title).toBe('Amigo secreto')
    expect(santa?.usesBackend).toBe(true)
    expect(santa?.category).toBe('Sorteios')
  })

  it('expõe as quatro rotas com o prefixo correto', () => {
    expect(santa?.routes.map((route) => route.path)).toEqual([
      '/secret-santa',
      '/secret-santa/g/:id',
      '/secret-santa/g/:id/me',
      '/secret-santa/g/:id/admin',
    ])
  })

  it('convive com o módulo raffle sem ids repetidos', () => {
    const ids = tools.map((tool) => tool.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('raffle')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/modules/secret-santa/manifest.test.ts`
Expected: FAIL (`santa` indefinido).

- [ ] **Step 3: Implementar o manifest**

`src/modules/secret-santa/manifest.ts`:
```ts
import { Gift } from '@lucide/vue'
import type { ToolManifest } from '@/core/modules/types'

const manifest: ToolManifest = {
  id: 'secret-santa',
  title: 'Amigo secreto',
  description: 'Crie um grupo, convie as pessoas e sorteie. Cada uma vê só quem tirou.',
  icon: Gift,
  category: 'Sorteios',
  usesBackend: true,
  routes: [
    { path: '/secret-santa', name: 'secret-santa', component: () => import('./CreateGroupView.vue') },
    { path: '/secret-santa/g/:id', name: 'secret-santa-group', component: () => import('./GroupView.vue') },
    { path: '/secret-santa/g/:id/me', name: 'secret-santa-me', component: () => import('./MeView.vue') },
    { path: '/secret-santa/g/:id/admin', name: 'secret-santa-admin', component: () => import('./AdminView.vue') },
  ],
}

export default manifest
```

- [ ] **Step 4: Implementar `AdminView`**

`src/modules/secret-santa/AdminView.vue`:
```vue
<script setup lang="ts">
import { Copy, Dices, MessageCircle, Trash2, TriangleAlert } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { drawGroup, listParticipants, removeParticipant, SantaApiError } from './lib/api'
import { adminUrl, inviteUrl, whatsappUrl } from './lib/links'
import { loadAdminToken, saveAdminToken } from './lib/session'

const route = useRoute()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'no-token' | 'forbidden' | 'not-found' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const status = ref<'open' | 'drawing' | 'drawn'>('open')
const participants = ref<{ name: string; isOrganizer: boolean }[]>([])
const adminToken = ref('')
const confirmOpen = ref(false)
const drawing = ref(false)

const invite = computed(() => inviteUrl(window.location.origin, groupId))
const adminLink = computed(() => adminUrl(window.location.origin, groupId, adminToken.value))
const canDraw = computed(() => status.value === 'open' && participants.value.length >= 3)

/** Lê o token do fragmento (#t=...) e o guarda; depois tira o token da barra de endereço. */
function readToken(): string | null {
  const match = window.location.hash.match(/[#&]t=([^&]+)/)
  if (match) {
    saveAdminToken(groupId, match[1])
    window.history.replaceState(null, '', window.location.pathname)
    return match[1]
  }
  return loadAdminToken(groupId)
}

async function refresh() {
  try {
    const result = await listParticipants({ groupId, adminToken: adminToken.value })
    status.value = result.status
    participants.value = result.participants
    state.value = 'ready'
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'FORBIDDEN') state.value = 'forbidden'
    else if (e instanceof SantaApiError && e.code === 'GROUP_NOT_FOUND') state.value = 'not-found'
    else {
      errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir o painel.'
      state.value = 'error'
    }
  }
}

onMounted(async () => {
  const token = readToken()
  if (!token) {
    state.value = 'no-token'
    return
  }
  adminToken.value = token
  await refresh()
})

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado.`)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

async function onRemove(name: string) {
  try {
    await removeParticipant({ groupId, adminToken: adminToken.value, name })
    toast.success(`${name} saiu do grupo.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível remover.')
  }
}

async function onDraw() {
  drawing.value = true
  try {
    await drawGroup({ groupId, adminToken: adminToken.value })
    confirmOpen.value = false
    toast.success('Sorteio feito. Avise o grupo para ver quem tirou.')
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível sortear.')
  } finally {
    drawing.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo o painel...</p>

    <div v-else-if="state === 'no-token' || state === 'forbidden'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Link de administração necessário</h1>
      <p class="text-muted-foreground">
        Abra o link de administração que apareceu quando você criou o grupo. Sem ele, não dá para sortear nem remover pessoas.
      </p>
      <Button as-child size="lg"><RouterLink :to="`/secret-santa/g/${groupId}`">Ir para o convite</RouterLink></Button>
    </div>

    <div v-else-if="state === 'not-found'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Grupo não encontrado</h1>
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir o painel</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button size="lg" @click="refresh">Tentar de novo</Button>
    </div>

    <template v-else>
      <header class="space-y-1">
        <h1 class="font-display text-3xl leading-tight">Painel do organizador</h1>
        <p class="text-muted-foreground">
          {{ status === 'drawn' ? 'O sorteio foi feito.' : 'Convide as pessoas e sorteie quando todo mundo entrar.' }}
        </p>
      </header>

      <div class="space-y-3">
        <h2 class="font-display text-xl">Convite</h2>
        <div class="flex gap-2">
          <Input :model-value="invite" readonly aria-label="Link do convite" />
          <Button variant="secondary" size="icon" aria-label="Copiar convite" @click="copy(invite, 'Convite')">
            <Copy class="size-4" aria-hidden="true" />
          </Button>
        </div>
        <Button as-child variant="outline" size="lg" class="w-full">
          <a :href="whatsappUrl('amigo secreto', invite)" target="_blank" rel="noopener noreferrer">
            <MessageCircle class="size-4" aria-hidden="true" />
            Enviar pelo WhatsApp
          </a>
        </Button>
      </div>

      <div class="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
        <p class="flex items-center gap-2 font-semibold"><TriangleAlert class="size-4" aria-hidden="true" />Guarde o link de administração</p>
        <p class="text-sm text-muted-foreground">É o único jeito de voltar a este painel em outro aparelho. Não envie para o grupo.</p>
        <Button variant="outline" size="sm" @click="copy(adminLink, 'Link de administração')">
          <Copy class="size-4" aria-hidden="true" />
          Copiar link de administração
        </Button>
      </div>

      <div class="space-y-3">
        <h2 class="font-display text-xl">Quem entrou ({{ participants.length }})</h2>
        <p v-if="participants.length === 0" class="text-muted-foreground">Ninguém entrou ainda. Envie o convite.</p>
        <ul v-else class="divide-y rounded-lg bg-card">
          <li v-for="person in participants" :key="person.name" class="flex items-center justify-between gap-2 px-4 py-3">
            <span>{{ person.name }}<span v-if="person.isOrganizer" class="ml-2 text-sm text-muted-foreground">(você)</span></span>
            <Button
              v-if="status === 'open'"
              variant="ghost"
              size="icon"
              :aria-label="`Remover ${person.name}`"
              @click="onRemove(person.name)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </Button>
          </li>
        </ul>
        <Button variant="ghost" size="sm" @click="refresh">Atualizar lista</Button>
      </div>

      <div v-if="status === 'open'" class="space-y-2">
        <Button size="lg" class="w-full" :disabled="!canDraw" @click="confirmOpen = true">
          <Dices class="size-4" aria-hidden="true" />
          Sortear
        </Button>
        <p v-if="!canDraw" class="text-sm text-muted-foreground">São necessárias pelo menos 3 pessoas para sortear.</p>
      </div>

      <Dialog v-model:open="confirmOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sortear agora?</DialogTitle>
            <DialogDescription>
              Depois do sorteio ninguém mais entra, sai nem muda a lista de desejos. Não dá para desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="confirmOpen = false">Cancelar</Button>
            <Button :disabled="drawing" @click="onDraw">{{ drawing ? 'Sorteando...' : 'Sortear' }}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </template>
  </section>
</template>
```

- [ ] **Step 5: README do módulo**

Em `README.md`, acrescentar uma seção "Amigo secreto" explicando: a arquitetura (Function como única porta de entrada), a variável do front `VITE_APPWRITE_SANTA_FUNCTION_ID`, o link para `functions/secret-santa/README.md`, e que o PIN guardado serve só para ver o próprio par.

- [ ] **Step 6: Verificação automática completa**

Run: `npm run typecheck && npx vitest run && npm run build && (cd functions/secret-santa && npm run build)`
Expected: tudo passa; o build do front mostra o chunk do módulo `secret-santa`.

- [ ] **Step 7: Commit**

```bash
git add src tests README.md
git commit -m "feat(santa): add organizer panel and register the secret santa module" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Verificação manual no navegador e revisão de design

**Files:** nenhum arquivo novo (correções de design, se houver, em commits próprios).

**Interfaces:**
- Consumes: Function publicada (Task 8) e `VITE_APPWRITE_SANTA_FUNCTION_ID=secret-santa` em `.env.local`.

- [ ] **Step 1: Subir o app e percorrer o fluxo de ponta a ponta**

Run: `npm run dev` (usar a porta livre que o Vite informar) e abrir no navegador embutido, a 375px de largura e depois em desktop. Conferir e registrar o resultado de cada item:
1. Home mostra os cards "Sorteador de nomes" e "Amigo secreto".
2. Criar grupo: os 3 passos avançam e voltam; "Continuar" fica desabilitado sem nome do grupo; sem participar, o passo 3 explica que o organizador não entra no sorteio.
3. Ao criar, abre o painel do organizador **sem `#t=` na barra de endereço** (o token foi guardado e removido da URL); recarregar a página mantém o painel.
4. Convite: copiar o link e abrir em outra aba anônima mostra o nome do grupo e a contagem; entrar com nome repetido (outra caixa e acento) mostra "Já existe alguém com esse nome" junto ao formulário; PIN com letras é recusado.
5. Entrar três ou mais pessoas, voltar ao painel: a lista mostra só os nomes; "Sortear" fica desabilitado com menos de 3 e habilitado com 3 ou mais; o diálogo de confirmação avisa que não dá para desfazer.
6. Depois do sorteio: cada pessoa, em aba anônima própria, entra com nome e PIN e vê a etiqueta fechada; "Revelar" vira a etiqueta e mostra só o próprio par e os desejos dele; o nome some sozinho em 15 segundos; "Esconder" funciona; recarregar mantém o painel (sessão) e o PIN não aparece na URL nem em `localStorage` (conferir com o console do navegador).
7. PIN errado 5 vezes mostra o bloqueio com os minutos; nome inexistente mostra a mesma mensagem de PIN errado.
8. Grupo inexistente (`/secret-santa/g/naoexiste`) mostra "Grupo não encontrado"; sem a variável da Function, a tela mostra o aviso de configuração, não uma página em branco.
9. Movimento reduzido (se o navegador permitir emular) mostra o nome sem girar; teclado: tab percorre todos os controles com foco visível.
10. Tema claro e escuro nas quatro telas, sem texto ilegível.

- [ ] **Step 2: Revisão de design contra o checklist da skill `ui-ux-pro-max`**

Rodar a busca de UX para os pontos que o fluxo toca (por exemplo `--domain ux "form validation error"` e `--domain ux "touch target spacing"`) e conferir as telas contra o checklist de pré-entrega: contraste 4,5:1, alvos de 44px, foco visível, sem emoji como ícone, `cursor-pointer` em elementos clicáveis, estados de carregamento, 375/768/1024/1440px. Corrigir o que falhar, um commit por correção, com a justificativa.

- [ ] **Step 3: Relatório**

Listar o que foi verificado e o que **não** foi (por exemplo: bloqueio real após 5 erros contra o Appwrite, `prefers-reduced-motion`, WhatsApp abrindo o app). Não marcar como verificado o que não foi exercitado.

---

## Self-Review (feita contra a spec)

- **Seção 2 (escopo):** criar grupo com nome, valor e data (Tasks 4, 11); organizador participa opcional (Tasks 4, 11); entrar, editar desejos (Tasks 4, 5, 11); painel com nomes, remover e sortear (Tasks 4, 6, 12); revelar (Tasks 5, 11). Exclusões, e-mail e outros itens ficam fora, como na spec.
- **Seção 3 (arquitetura):** Function como única porta (Tasks 4 a 7, 9); código em `functions/secret-santa/` e `src/modules/secret-santa/`; testes em `tests/`.
- **Seção 4 (dados):** tabelas e colunas em Task 8; índice único `(groupId, nameKey)` cobre a corrida de duas entradas com o mesmo nome (Tasks 7 e 8); datetimes em ISO com `Z` (adaptador, Task 7).
- **Seção 5 (contrato):** as 8 ações estão nas Tasks 4 (createGroup, getGroup, join, listParticipants, removeParticipant), 5 (updateWishlist, reveal) e 6 (draw); limites em Task 1; códigos de erro em Task 1; cliente tipado em Task 9.
- **Seção 6 (segurança):** scrypt e tokens (Task 2); bloqueio e erro genérico (Task 5); token no fragmento (Tasks 10, 11, 12); nada de pares no navegador (Tasks 5, 6); PIN fora do `localStorage` (Task 10).
- **Seção 7 (sorteio):** roda única, mínimo 3, `drawing` e rollback (Tasks 3 e 6).
- **Seção 8 (front-end):** quatro rotas e manifest (Task 12); sessão em `sessionStorage` (Task 10).
- **Seção 9 (design):** paleta, Nunito, etiqueta de presente com auto-esconder e movimento reduzido, confirmação em diálogo, WhatsApp e copiar (Tasks 10 a 12, revisão em Task 13). A seção 9 da spec fala em "diálogo do shadcn-vue": coberto por Task 11 Step 1.
- **Seção 10 (erros):** mensagens em `api.ts` e nas telas (Tasks 9, 11, 12).
- **Seção 11 (testes):** `assignSecretFriends`, `pin`, `tokens`, `validate`, handler com banco falso, `api.ts`, `useReveal`, `GiftTag`, manifest. **Desvio:** a spec cita "componentes de formulário" testados; o plano testa `GiftTag` e a lógica (api, sessão, links, composable) e deixa as telas de formulário para a verificação manual da Task 13, porque são casca fina sobre `api.ts`, já coberto.
- **Seção 12 (publicação):** Task 8, com o aviso de que a escrita no Appwrite precisa de autorização explícita da usuária e de uma chave nova de escopo mínimo.
- **Placeholders:** nenhum "TBD"/"TODO"; todo passo de código traz o código. Os passos da Task 8 e da Task 13 são operações e verificações, não código.
- **Consistência de tipos:** `SantaDb`, `GroupRow`, `ParticipantRow`, `HandlerDeps`, `Execute`, `Credentials`, `GroupInfo`, `RevealResult` têm a mesma forma em todas as tarefas que os usam. `handleAction(db, body, deps)` e `createEntrypoint(getDb)` são usados como definidos. Nota: no Task 4, o `switch` é escrito sem a variável `now` e sem os casos `updateWishlist`, `reveal` e `draw`; as Tasks 5 e 6 dizem exatamente onde acrescentar cada um.
- **Review Focus:** cada item tem teste: 1 em Tasks 1, 4 e 5; 2 em Tasks 1 e 5; 3 em Tasks 3 e 6; 4 em Tasks 5 e 6; 5 em Tasks 9, 11 e 12 (e manual na Task 13).
