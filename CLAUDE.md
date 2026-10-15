# Canivete

- Cabeçalho das ferramentas: três FactTile, duas `glass` e uma `paper`. Nas `glass`, rótulo e valor ficam numa linha só num celular de 360px: cabem 83px, uns 12 caracteres no rótulo e 9 no valor ("Faces" / "4 a 100", "Prazos" / "Dias úteis"). Número dinâmico vai sozinho no valor, com a unidade no rótulo ("Pessoas" / "12"). O texto longo vai na `paper`. O teste `tests/components/factTiles.test.ts` mede os textos fixos: rode-o ao criar ou mudar um cabeçalho.
- Campos com formato conhecido (telefone, CPF, CNPJ, CEP, data) usam a máscara `v-maska` com `data-maska`.
- Números e links usam a fonte padrão do app (nada de `font-mono`), com `tabular-nums` quando precisam alinhar.
- Todo identificador de código, rota e parâmetro de URL em inglês; só o texto que a pessoa lê fica em português.
- Quadrado de ícone (chip): `rounded-chip` (raio de 28% do lado, vale para qualquer tamanho) e borda do sistema (`border` com a cor do chip a 20%).
- Elemento com raio dentro de outro com raio e respiro (padding): raio de dentro = raio de fora - padding - borda (curvas paralelas), por exemplo `rounded-[calc(var(--radius-xl)-5px)]`.
- Estado vazio, bloqueado ou de erro usa sempre o componente `EmptyState` (borda tracejada, ícone em quadrado, texto curto); nada de bloco tracejado feito à mão.
- `EmptyState`: só `icon` e `description` (sem título). Carregamento usa os esqueletos de `components/skeletons` com o formato da página, nunca spinner solto.
- Um tipo de campo, um componente: data = `DateField` (digita dd/mm/aaaa ou escolhe no calendário), cor = `ColorField`, quantidade inteira pequena = `NumberInput`, faixa = `ui/slider`, arquivo = `FileField`, hora ou duração = `TimeField`, lista de opções curtas = `TagInput`, resultado com vários campos copiáveis = `CopyRows`, dinheiro = `Input` com `v-money` + `parseMoney`. Criou ou mudou um desses: troque em todas as telas que têm o mesmo tipo de campo, para ficar tudo igual.
- Tag = `Badge`: raio padrão (`rounded-md`, nunca totalmente arredondada) e sempre com borda. A tag de categoria na home usa `variant="category"` com `data-category`. Não ponha `rounded-*` na mão.
- A cor da ferramenta é a cor da categoria dela (faixa e ícone do card, primário da página, tag): o manifest não tem `color`, `toolColor` em `src/core/modules/categories.ts` resolve, e as cores ficam em `--cat-*` no `style.css` (um teste confere o contraste). A home não tem botões de filtro por categoria.
- Ferramentas em que o giro é o conteúdo (moeda, dados, roleta, sorteio) animam sempre, mesmo com "menos movimento" no sistema: sem aviso e sem pergunta, por decisão do dono. Só o confete mantém o próprio modo reduzido.

## Exploração de código
Antes de usar Grep, Glob ou ler arquivos direto, chame as ferramentas do `code-review-graph`:
- `semantic_search_nodes_tool` para achar funções e componentes pela intenção.
- `get_impact_radius_tool` antes de edições com grande raio de impacto.
- `detect_changes_tool` + `get_review_context_tool` para revisões de código.
Só use os comandos comuns de leitura se o grafo não responder.

O grafo fica em `.code-review-graph/` (fora do git): `code-review-graph build` na primeira vez em cada máquina; o gancho da configuração do usuário atualiza a cada edição. Sem embeddings, a busca é por texto: procure pelo nome em inglês do código (`workHoursBetween`, `toolColor`), não pela descrição em português.
