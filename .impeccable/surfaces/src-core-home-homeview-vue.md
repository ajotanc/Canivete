---
version: 1
slug: "src-core-home-homeview-vue"
primary_target: "src/core/home/HomeView.vue"
related_targets: []
---

# Surface brief: Canivete (home + ferramentas)

Mode: Operate. Escopo: shell, home, sorteador de nomes e amigo secreto.

Audiência e tarefa: qualquer pessoa no celular, chegando por link de WhatsApp, resolvendo uma tarefa curta. Quem organiza usa também o desktop. A home precisa aguentar 10+ ferramentas.

Pinned pelo usuário: "tecnológico, mas com cara de site de ferramentas". Profissional, moderno, sem cara de IA. Usar componentes shadcn-vue (input-group, field, pin-input, tags-input, command, empty). A rolagem de mundos foi deixada de lado por esse pino.

## Direction contract

THESIS: Um catálogo de ferramentas de precisão, não uma landing. Cada ferramenta tem uma cor de cabo própria, como as de Wera e Victorinox, e todas guardam o mesmo rigor. Recusa o padrão do cartão de SaaS cinza com ícone em quadradinho.
OWN-WORLD: chão cinza-aço frio (#EEF1F4), superfícies brancas, tinta azul-noite (#0E1420), vermelho de pivô (#E5322D) só na marca e nos estados críticos. Cada ferramenta uma cor de cabo: cobalto #2457F5 (sorteador), pinho #0E7C57 (amigo secreto). Gabarito nos títulos (família de estúdio brasileiro) e Onest no texto; sem monoespaçada. Raio pequeno (8px nos controles, 12px nos cards), linhas de 1px, números tabulares, atalhos de teclado visíveis. Dark: grafite azulado #111823, não preto.
STORY: a pessoa entende em segundos que é uma caixa de ferramentas sem cadastro, acha a ferramenta por busca ou paleta de comandos (⌘K ou "/"), abre e resolve; resultados mostram o selo de verificável/privado.
FIRST VIEWPORT: cabeçalho de 56px com marca (pivô vermelho), botão de busca com Kbd e tema; abaixo, título curto à esquerda, campo de busca em InputGroup e filtros de categoria em ToggleGroup; em seguida a grade de ferramentas, cada uma com faixa de cabo colorida, miniatura do que a ferramenta faz, título e descrição. No celular: coluna única, busca no topo, alvos de 44px.
FORM: direção fixada pelo usuário (sem posição na lista de sete); seed key 3c1fec5f; assinatura: a faixa de cabo colorida que acompanha a ferramenta da home até a página dela (a cor vira o primário da página) e a paleta de comandos.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
