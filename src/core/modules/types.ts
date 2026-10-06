import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

/** Descreve uma ferramenta do Canivete. Cada módulo exporta um destes em `manifest.ts`. */
export interface ToolManifest {
  /** Slug único, usado como prefixo das rotas (ex.: 'raffle'). */
  id: string
  /** Título exibido ao usuário (pt-BR). */
  title: string
  /** Descrição curta exibida na home (pt-BR). */
  description: string
  /** Ícone de @lucide/vue exibido no card. */
  icon: Component
  /** Cor de destaque do card na home; `secondary` (coral) é para módulos festivos. Padrão: `primary`. */
  accent?: 'primary' | 'secondary'
  /** Categoria usada no filtro da home. */
  category: string
  /** True se o módulo depende do Appwrite. */
  usesBackend: boolean
  /** Rotas do módulo, com componentes carregados sob demanda. */
  routes: RouteRecordRaw[]
}
