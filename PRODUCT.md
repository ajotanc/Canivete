# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Qualquer pessoa no Brasil, quase sempre no celular. O caso típico: alguém recebe um link por WhatsApp e precisa resolver algo na hora (participar de um amigo secreto, ver o resultado de um sorteio). Existe também quem organiza: cria o grupo de amigo secreto, cadastra as pessoas e dispara o sorteio, em geral no desktop ou no celular. Interface 100% em português do Brasil.

## Product Purpose

Canivete é um hub público de ferramentas utilitárias pequenas. Cada ferramenta resolve uma única tarefa e é um módulo independente. Hoje: sorteador de nomes (animação, histórico, link verificável) e amigo secreto (grupo, PIN por pessoa, lista de desejos, perguntas anônimas, mural). Sucesso: a pessoa abre, resolve e sai sem atrito, e tem vontade de voltar e de mandar o link para outras pessoas.

## Positioning

Uma caixa de ferramentas sem cadastro para usar (hoje também sem anúncios, mas isso pode mudar e não deve virar promessa na interface; conta existe só para quem organiza amigo secreto), com resultados verificáveis e privados (sorteio com registro verificável por link; no amigo secreto cada pessoa vê só o seu par), em que cada ferramenta tem personalidade própria mas todas parecem da mesma família. Instalável como PWA e leve.

## Operating Context

- Abertura por links compartilhados no WhatsApp; uso em telas pequenas, rede móvel, sessões curtas.
- Convidados entram no amigo secreto com nome e PIN de 4 a 6 números, sem conta.
- Organizador entra com e-mail e senha (Appwrite). O sorteio do amigo secreto roda no servidor (Appwrite Function); o sorteador de nomes roda no navegador e grava um registro com hash verificável.
- Crescimento esperado: muitas ferramentas (10 ou mais). A home precisa escalar com busca, categorias e acesso rápido; adicionar uma ferramenta é criar uma pasta em `src/modules/` com um `manifest.ts`.

## Capabilities and Constraints

- Stack existente: Vue 3, Vite, TypeScript, Vue Router, Tailwind CSS v4, shadcn-vue (Reka UI), @lucide/vue, Appwrite. Estilo apenas com classes utilitárias do Tailwind (sem `<style>` nos componentes); componentes de UI do shadcn-vue em `src/components/ui/`.
- Convenções: código, rotas e chaves em inglês; textos, mensagens e comentários em português (pt-BR).
- Um módulo nunca importa de outro; o núcleo nunca importa de um módulo específico.
- Tema claro e escuro; PWA com atualização por aviso.
- Sem geração de imagens disponível nesta máquina: visuais são desenhados em código.

## Brand Commitments

Nome: Canivete. Metáfora de canivete suíço (várias ferramentas, uma só peça) é a ideia de produto; a identidade visual atual (neutra, padrão shadcn) é provisória e será substituída. O usuário exige aparência profissional, moderna e tecnológica, sem cara de interface gerada por IA, e quer que as pessoas tenham vontade de usar.

## Evidence on Hand

Duas ferramentas funcionando em `src/modules/raffle` e `src/modules/secret-santa`. Não há depoimentos, números de uso, clientes ou logotipo definitivo; nada disso deve ser inventado.

## Product Principles

1. Resolver na hora: o caminho até o resultado é o mais curto possível, sem cadastro nem explicação.
2. Confiança visível: privacidade e verificabilidade aparecem na interface, em linguagem simples.
3. Uma caixa, muitas ferramentas: família coesa, cada ferramenta com identidade própria.
4. Celular primeiro, desktop sem sobra: toque confortável, texto legível, links compartilháveis.
5. Escalar sem inchar: a home e a navegação aguentam dezenas de ferramentas.

## Accessibility & Inclusion

Contraste legível em telas pequenas ao sol, foco visível, alvos de toque confortáveis, respeito a prefers-reduced-motion, formulários com rótulos e erros claros. Português do Brasil, sem jargão técnico.
