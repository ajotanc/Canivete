# Canivete

Hub público de ferramentas. Vue 3 + Vite + TypeScript + Tailwind v4 + shadcn-vue + `@lucide/vue` + Appwrite (só onde necessário). Instalável como PWA.

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # preencha as variáveis do Appwrite
pnpm dev
pnpm test                    # Vitest; todos os testes ficam em tests/
pnpm build
```

Ícones do PWA: edite `public/icon.svg` e rode `pnpm generate-pwa-assets`.

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
| Cara ou coroa e dados (toque na moeda; dados de D4 a D100) | `coin-dice` | não |
| Roleta (2 a 24 opções, com opção de tirar cada sorteada) | `wheel` | não |
| Calculadora de horas (entre horários, somar e subtrair, hora de saída, horas úteis entre datas) | `hours` | não |
| Decodificador de JWT (cabeçalho, conteúdo, validade e assinatura HS256/384/512) | `jwt` | não |
| Comparador de texto (diff por linha e por palavra) | `diff` | não |
| Conversor de moeda (cotação atualizada a cada minuto) | `currency` | não |
| Feriados do ano (nacionais, dia da semana e quantos dias faltam) | `holidays` | não |
| Placar (cores por jogador, meta da partida, vitórias, desfazer e telão) | `scoreboard` | não |

Três ferramentas chamam um serviço externo, direto do navegador: a consulta de CEP (`viacep.com.br`), o conversor de moeda (`economia.awesomeapi.com.br`) e os feriados (`brasilapi.com.br`). As outras rodam só no aparelho.

## Home, favoritas e categorias

A home lista as ferramentas em ordem aleatória, sorteada a cada visita, com as favoritas sempre em cima (na busca, por relevância). Dois botões ao lado da busca alternam a ordem a cada toque (aleatória, A a Z, Z a A) e separam a lista por categoria; as escolhas ficam no navegador (`canivete:home-sort` e `canivete:home-grouped`). A estrela de cada card marca a ferramenta como favorita: as favoritas ficam numa seção no topo e primeiro na busca (Ctrl/⌘ K), guardadas só no navegador (`canivete:favorites`). A cor de cada ferramenta vem da categoria dela (`src/core/modules/categories.ts` e `--cat-*` em `src/style.css`), então ferramentas da mesma categoria têm a mesma cor.

## PWA

O service worker e o manifesto também são gerados no servidor de desenvolvimento (`devOptions` em `vite.config.ts`), então dá para instalar o app pelo endereço de desenvolvimento. O rodapé mostra "Instalar o app" quando o navegador permite e, no iPhone, o caminho pelo menu Compartilhar.

## Som

Os efeitos sonoros (roleta, dados, moeda, carta do amigo secreto) são sintetizados na hora pelo Web Audio, em `src/core/effects/sound.ts`; não há arquivos de áudio. O botão de som no cabeçalho liga e desliga, e a escolha fica no `localStorage` (`canivete:sound`). Para criar um efeito novo, acrescente o nome em `SoundName` e a receita em `SOUNDS`.

## Convenções

Código (nomes de arquivos, funções, variáveis, tipos, rotas) em inglês. Textos de interface, mensagens, comentários e blocos de documentação em português. Estilo 100% Tailwind; `style` inline só para valores dinâmicos.

## Adicionar uma ferramenta

Crie `src/modules/<id>/manifest.ts` exportando um `ToolManifest` (ver `src/core/modules/types.ts`). A cor vem da `category`; categoria nova precisa de entrada em `src/core/modules/categories.ts` e da cor em `src/style.css`.
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
5. Preencha `.env.local` só com `VITE_APPWRITE_ENDPOINT` e `VITE_APPWRITE_PROJECT_ID`. Os ids do banco, da tabela, da Function e do bucket ficam no código, em `APPWRITE_IDS` (`src/core/config.ts`): se criar o banco com outro id, troque lá.

## Amigo secreto

O módulo `secret-santa` guarda segredos (PINs e pares do sorteio), então o navegador nunca lê as tabelas. Toda leitura e escrita passa por uma Appwrite Function (`functions/secret-santa/`), que valida os dados, confere nome e PIN, sorteia e devolve a cada pessoa só o próprio par. As tabelas `santa_groups`, `santa_participants`, `santa_questions` e `santa_posts` não têm permissão para ninguém.

- O organizador entra com uma conta do Appwrite Auth (e-mail e senha), cria o grupo, cadastra as pessoas pelo nome no painel e manda um único link para o grupo. Cada pessoa escolhe o próprio nome e, no primeiro acesso, cria o PIN. Se alguém escolher o nome errado ou esquecer o PIN, o organizador zera o PIN no painel.
- O painel do organizador também define o endereço amigável do link, a cor do grupo, a imagem do cabeçalho, o valor sugerido, a data e as regras de quem não pode tirar quem, faz e refaz o sorteio e apaga o grupo. Cada pessoa tem lista de desejos, perguntas anônimas para quem tirou e o mural do grupo.
- No front não há variável própria do amigo secreto: o id da Function (`secret-santa`) e o do bucket das capas (`santa_covers`) estão em `APPWRITE_IDS`, em `src/core/config.ts`.
- A imagem do cabeçalho vira WebP no navegador e sobe pela Function, que grava no bucket `santa_covers` (leitura pública, só a Function grava) e apaga a anterior quando o organizador troca ou tira a foto.
- Tabelas, bucket, variáveis e publicação da Function estão em [`functions/secret-santa/README.md`](functions/secret-santa/README.md).
- O PIN serve só para a pessoa ver o próprio par, editar a lista de desejos, perguntar e escrever no mural. Ele é guardado como hash `scrypt`, nunca vai para a URL e só fica no `sessionStorage` da aba enquanto ela está aberta.
- As ações de administração só valem para o dono do grupo: a Function compara o `ownerId` do grupo com o id da conta que fez a chamada (cabeçalho `x-appwrite-user-id`, preenchido pela Appwrite).

## Hospedagem

O site usa rotas por histórico (`/raffle/r/abc`). A hospedagem precisa devolver `index.html` para qualquer rota desconhecida (fallback de SPA). Em HTTPS, o service worker do PWA também faz esse fallback no navegador.

## Licença

[PolyForm Noncommercial 1.0.0](LICENSE): o código é livre para usar, estudar, modificar e contribuir, desde que sem fins comerciais. Uso comercial precisa de autorização do autor.
