# Canivete

- Cabeçalho das ferramentas: três FactTile numa linha só em cada caixa (rótulo e valor curtos, sem quebrar), duas `glass` e uma `paper`.
- Campos com formato conhecido (telefone, CPF, CNPJ, CEP, data) usam a máscara `v-maska` com `data-maska`.
- Números e links usam a fonte padrão do app (nada de `font-mono`), com `tabular-nums` quando precisam alinhar.
- Todo identificador de código, rota e parâmetro de URL em inglês; só o texto que a pessoa lê fica em português.
- Quadrado de ícone (chip): `rounded-chip` (raio de 28% do lado, vale para qualquer tamanho) e borda do sistema (`border` com a cor do chip a 20%).
- Elemento com raio dentro de outro com raio e respiro (padding): raio de dentro = raio de fora - padding - borda (curvas paralelas), por exemplo `rounded-[calc(var(--radius-xl)-5px)]`.
- Estado vazio, bloqueado ou de erro usa sempre o componente `EmptyState` (borda tracejada, ícone em quadrado, texto curto); nada de bloco tracejado feito à mão.
- `EmptyState`: só `icon` e `description` (sem título). Carregamento usa os esqueletos de `components/skeletons` com o formato da página, nunca spinner solto.
- Um tipo de campo, um componente: data = `DateField` (digita dd/mm/aaaa ou escolhe no calendário), cor = `ColorField`, quantidade inteira pequena = `NumberInput`, faixa = `ui/slider`. Criou ou mudou um desses: troque em todas as telas que têm o mesmo tipo de campo, para ficar tudo igual.
