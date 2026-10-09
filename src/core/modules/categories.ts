/**
 * Categorias das ferramentas e a cor de cada uma. A cor da categoria é a cor da ferramenta: a faixa e o ícone do card
 * na home, o primário da página dela e a tag. Por isso o manifest não tem cor própria. O nome é o que a pessoa lê (vem do `category` do manifest);
 * a chave vai no `data-category` e escolhe a cor definida em `src/style.css` (`--cat-<chave>`).
 * Ferramenta nova numa categoria nova: acrescente aqui e a cor no CSS (um teste confere que toda categoria tem cor).
 */
export const CATEGORIES = [
  { name: 'Calculadoras', key: 'calculators' },
  { name: 'Comunicação', key: 'communication' },
  { name: 'Desenvolvimento', key: 'development' },
  { name: 'Design', key: 'design' },
  { name: 'Diversão', key: 'fun' },
  { name: 'Imagem', key: 'image' },
  { name: 'Segurança', key: 'security' },
  { name: 'Sorteios', key: 'draws' },
  { name: 'Texto', key: 'text' },
  { name: 'Utilidades', key: 'utilities' },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']

/** Chave da categoria pelo nome; categoria desconhecida fica neutra (`other`). */
export const categoryKey = (name: string): CategoryKey | 'other' => CATEGORIES.find((category) => category.name === name)?.key ?? 'other'

/** Cor da ferramenta (valor de `data-tool`): a da categoria dela. */
export const toolColor = (tool: { category: string }): string => categoryKey(tool.category)
