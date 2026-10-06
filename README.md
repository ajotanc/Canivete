# Canivete

Hub público de ferramentas. Vue 3 + Vite + TypeScript + Tailwind v4 + shadcn-vue + `@lucide/vue` + Appwrite (só onde necessário). Instalável como PWA.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha as variáveis do Appwrite
npm run dev
npm test                     # Vitest; todos os testes ficam em tests/
npm run build
```

Ícones do PWA: edite `public/icon.svg` e rode `npm run generate-pwa-assets`.

## Estrutura

- `src/core`: layout, home, tema, registro de módulos e serviços (Appwrite).
- `src/components/ui`: componentes do shadcn-vue.
- `src/modules/<id>`: cada ferramenta.
- `tests/`: todos os testes, espelhando a estrutura de `src/`.

## Convenções

Código (nomes de arquivos, funções, variáveis, tipos, rotas) em inglês. Textos de interface, mensagens, comentários e blocos de documentação em português. Estilo 100% Tailwind; `style` inline só para valores dinâmicos.

## Adicionar uma ferramenta

Crie `src/modules/<id>/manifest.ts` exportando um `ToolManifest` (ver `src/core/modules/types.ts`).
As rotas do módulo devem começar com `/<id>`. Nada no `core` precisa ser editado. Crie os testes em `tests/modules/<id>/`.

## Configurar o Appwrite (sorteador)

O projeto usa o serviço `TablesDB` do SDK do Appwrite (`createRow` / `getRow`).

1. No console do Appwrite, crie um projeto e adicione uma plataforma **Web** com o domínio do site (e `localhost` para desenvolvimento).
2. Crie um banco de dados e uma tabela com id `raffles`.
3. Crie as colunas:

| Coluna | Tipo | Tamanho | Obrigatória | Array |
|---|---|---|---|---|
| `participants` | string | 100 | sim | sim |
| `winners` | string | 100 | sim | sim |
| `drawnAt` | datetime | | sim | não |
| `hash` | string | 64 | sim | não |

4. Permissões da tabela: **Read** e **Create** para `Any`. **Não** conceda Update nem Delete.
5. Preencha `.env.local` com `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DATABASE_ID` e `VITE_APPWRITE_RAFFLES_TABLE_ID`.

## Hospedagem

O site usa rotas por histórico (`/raffle/r/abc`). A hospedagem precisa devolver `index.html` para qualquer rota desconhecida (fallback de SPA). Em HTTPS, o service worker do PWA também faz esse fallback no navegador.
