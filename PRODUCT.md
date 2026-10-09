# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Qualquer pessoa no Brasil, quase sempre no celular. O caso típico: alguém recebe um link por WhatsApp e precisa resolver algo na hora (participar de um amigo secreto, ver o resultado de um sorteio). Existe também quem organiza: cria o grupo de amigo secreto, cadastra as pessoas e dispara o sorteio, em geral no desktop ou no celular. Interface 100% em português do Brasil.

## Product Purpose

Canivete é um hub público de ferramentas utilitárias pequenas. Cada ferramenta resolve uma única tarefa e é um módulo independente. Hoje são 30, de calculadoras e conversores a sorteios; as duas que usam servidor são o sorteador de nomes (com link verificável) e o amigo secreto (grupo, PIN por pessoa, lista de desejos, perguntas anônimas, mural). A lista completa está no `README.md`. Sucesso é a pessoa resolver o que veio fazer sem tropeçar, voltar outras vezes e mandar o link para outras pessoas.

## Positioning

Uma caixa de ferramentas sem cadastro para usar (hoje também sem anúncios, mas isso pode mudar e não deve virar promessa na interface; conta existe só para quem organiza amigo secreto), com resultados verificáveis e privados (sorteio com registro verificável por link; no amigo secreto cada pessoa vê só o seu par), em que cada ferramenta tem personalidade própria mas todas parecem da mesma família. Instalável como PWA e leve.

## Operating Context

- Abertura por links compartilhados no WhatsApp; uso em telas pequenas, rede móvel, sessões curtas.
- Convidados entram no amigo secreto com nome e PIN de 4 a 6 números, sem conta.
- Organizador entra com e-mail e senha (Appwrite). O sorteio do amigo secreto roda no servidor (Appwrite Function); o sorteador de nomes roda no navegador e grava um registro com hash verificável.
- A lista de ferramentas continua crescendo. A home escala com busca (por palavras, no campo da página e na paleta Ctrl/⌘ K); adicionar uma ferramenta é criar uma pasta em `src/modules/` com um `manifest.ts`.

## Capabilities and Constraints

- Stack existente: Vue 3, Vite, TypeScript, Vue Router, Tailwind CSS v4, shadcn-vue (Reka UI), @lucide/vue, Appwrite. Estilo com classes utilitárias do Tailwind; `<style>` só para animação que o Tailwind não cobre (transições do Vue e keyframes, como na carta do amigo secreto e no placar). Componentes de UI do shadcn-vue em `src/components/ui/`.
- Convenções: código, rotas e chaves em inglês; textos, mensagens e comentários em português (pt-BR).
- Um módulo nunca importa de outro; o núcleo nunca importa de um módulo específico.
- Tema claro e escuro; PWA com atualização por aviso.
- Sem geração de imagens disponível nesta máquina: visuais são desenhados em código.

## Brand Commitments

Nome: Canivete. A ideia de produto vem do canivete suíço: várias ferramentas numa peça só. A identidade visual está em `DESIGN.md` (cada ferramenta com a sua cor de cabo). O dono quer uma aparência profissional e moderna, sem cara de interface gerada por IA, que dê vontade de usar.

## Evidence on Hand

As 30 ferramentas funcionando em `src/modules/`. Não há depoimentos, números de uso nem clientes, e nada disso deve ser inventado.

## Product Principles

1. Resolver na hora: o caminho até o resultado é o mais curto possível, sem cadastro nem explicação.
2. Confiança visível: privacidade e verificabilidade aparecem na interface, em linguagem simples.
3. Uma caixa, muitas ferramentas: família coesa, cada ferramenta com identidade própria.
4. Celular primeiro, desktop sem sobra: toque confortável, texto legível, links compartilháveis.
5. Escalar sem inchar: a home e a navegação aguentam dezenas de ferramentas.

## Accessibility & Inclusion

Contraste legível em telas pequenas ao sol, foco visível, alvos de toque confortáveis, formulários com rótulos e erros claros. Movimento respeita prefers-reduced-motion, com uma exceção decidida pelo dono: nas ferramentas em que o giro é o conteúdo (moeda, dados, roleta, sorteio) a animação sempre acontece. Português do Brasil, sem jargão técnico.
