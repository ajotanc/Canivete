# Contribuindo com o Canivete

Obrigado por querer ajudar. Contribuições são bem-vindas: correções, ferramentas novas, melhorias de texto e de acessibilidade.

## Antes de começar

- Abra uma issue para ideias grandes (ferramenta nova, mudança de layout), para alinharmos antes de você investir tempo.
- Correções pequenas podem ir direto em pull request.

## Como rodar

```bash
pnpm install
pnpm dev
```

Antes de abrir o pull request, confira:

```bash
pnpm typecheck
pnpm test
```

## Convenções

- Identificadores de código, rotas e parâmetros de URL em inglês; só o texto que a pessoa lê fica em português.
- Reaproveite os componentes existentes (`DateField`, `NumberInput`, `EmptyState`, `Badge` etc.) em vez de criar variações.
- Ao criar ou mudar o cabeçalho de uma ferramenta, rode `tests/components/factTiles.test.ts`.

## Licença e direitos sobre a contribuição

O projeto usa a [PolyForm Noncommercial 1.0.0](LICENSE). Ao enviar uma contribuição, você concorda que:

1. **Origem (DCO).** Você escreveu o código ou tem o direito de enviá-lo, conforme o [Developer Certificate of Origin 1.1](https://developercertificate.org/). Assine os commits com `git commit -s`, que adiciona a linha `Signed-off-by: Seu Nome <email>`.
2. **Licença do projeto.** Sua contribuição é licenciada sob a mesma licença do projeto.
3. **Direito do autor.** Alerson Jorge, autor e titular do projeto, pode usar, modificar e relicenciar a sua contribuição, inclusive em versões comerciais ou sob outra licença, sem pedir nova autorização. Você mantém o copyright sobre o que escreveu.

Se você não concorda com algum desses pontos, não envie a contribuição.
