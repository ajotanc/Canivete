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

## Ferramentas

| Ferramenta | Pasta | Usa Appwrite |
|---|---|---|
| Sorteador | `raffle` | sim |
| Amigo secreto | `secret-santa` | sim |
| Gerador e validador de CPF e CNPJ | `cpf-cnpj` | não |
| QR Code | `qrcode` | não |
| Link de WhatsApp | `whatsapp` | não |
| Contador de texto | `text-counter` | não |
| Gerador de senhas (senha ou frase, com medidor de força) | `password` | não |
| Consulta de CEP (por CEP ou pela rua, via ViaCEP) | `cep` | não |
| Calculadora de datas (diferença, dias úteis com feriados nacionais, idade) | `dates` | não |
| Ferramentas de texto (caixa, camelCase, slug, linhas, Base64, URL) | `text-tools` | não |
| Calculadora de porcentagem (%, desconto, variação, juros) | `percentage` | não |
| Dados fictícios (pessoa com CPF válido, e-mail, telefone, endereço; copia em JSON) | `fake-data` | não |
| Cores (HEX, RGB, HSL, tons e contraste WCAG) | `colors` | não |
| Cronômetro, timer e Pomodoro (aviso sonoro ao fim) | `timer` | não |
| Conversor de unidades (comprimento, peso, volume, temperatura, área, velocidade, tempo, dados) | `units` | não |
| Formatador de JSON (valida, formata, compacta, ordena chaves) | `json` | não |
| Racha-conta (gorjeta, centavos que fecham, texto para o grupo) | `split-bill` | não |
| Gasolina ou etanol (regra dos 70% ou consumo do carro, custo da viagem) | `fuel` | não |
| Valor por extenso (reais e números, até 999 bilhões) | `amount-words` | não |
| UUID e hash (v4, v7, SHA-1/256/384/512 e HMAC) | `hash` | não |
| Lorem ipsum (parágrafos, frases ou palavras; latim ou português; HTML) | `lorem` | não |
| Comprimir imagem (reduz peso e largura; aceita JPEG, PNG, WebP, GIF, BMP, AVIF e SVG; saída JPEG, WebP ou PNG) | `image` | não |
| Cara ou coroa e dados (D4 a D100) | `coin-dice` | não |

A consulta de CEP é a única que chama um serviço externo (`viacep.com.br`, direto do navegador); as outras rodam só no aparelho.

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

## Amigo secreto

O módulo `secret-santa` guarda segredos (PINs e pares do sorteio), então o navegador nunca lê as tabelas. Toda leitura e escrita passa por uma Appwrite Function (`functions/secret-santa/`), que valida os dados, confere nome e PIN, sorteia e devolve a cada pessoa só o próprio par. As tabelas `santa_groups`, `santa_participants`, `santa_questions` e `santa_posts` não têm permissão para ninguém.

- O organizador entra com uma conta do Appwrite Auth (e-mail e senha), cria o grupo, cadastra as pessoas pelo nome no painel e manda um único link para o grupo. Cada pessoa escolhe o próprio nome e, no primeiro acesso, cria o PIN. Se alguém escolher o nome errado ou esquecer o PIN, o organizador zera o PIN no painel.
- O painel do organizador também define o endereço amigável do link, a cor do grupo, o valor sugerido, a data e as regras de quem não pode tirar quem, faz e refaz o sorteio e apaga o grupo. Cada pessoa tem lista de desejos, perguntas anônimas para quem tirou e o mural do grupo.
- No front, defina `VITE_APPWRITE_SANTA_FUNCTION_ID` (normalmente `secret-santa`) além de `VITE_APPWRITE_ENDPOINT` e `VITE_APPWRITE_PROJECT_ID`.
- Tabelas, variáveis e publicação da Function estão em [`functions/secret-santa/README.md`](functions/secret-santa/README.md).
- O PIN serve só para a pessoa ver o próprio par, editar a lista de desejos, perguntar e escrever no mural. Ele é guardado como hash `scrypt`, nunca vai para a URL e só fica no `sessionStorage` da aba enquanto ela está aberta.
- As ações de administração só valem para o dono do grupo: a Function compara o `ownerId` do grupo com o id da conta que fez a chamada (cabeçalho `x-appwrite-user-id`, preenchido pela Appwrite).

## Hospedagem

O site usa rotas por histórico (`/raffle/r/abc`). A hospedagem precisa devolver `index.html` para qualquer rota desconhecida (fallback de SPA). Em HTTPS, o service worker do PWA também faz esse fallback no navegador.
