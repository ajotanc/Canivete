# Canivete

- Cabeçalho das ferramentas: três FactTile numa linha só em cada caixa (rótulo e valor curtos, sem quebrar), duas `glass` e uma `paper`.
- Campos com formato conhecido (telefone, CPF, CNPJ, CEP, data) usam a máscara `v-maska` com `data-maska`.
- Números e links usam a fonte padrão do app (nada de `font-mono`), com `tabular-nums` quando precisam alinhar.
- Todo identificador de código, rota e parâmetro de URL em inglês; só o texto que a pessoa lê fica em português.
- Elemento com raio dentro de outro com raio e respiro (padding): raio de dentro = raio de fora - padding - borda (curvas paralelas), por exemplo `rounded-[calc(var(--radius-xl)-5px)]`.
