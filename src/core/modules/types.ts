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
  /** Miniatura do que a ferramenta faz, exibida no card da home sobre o campo colorido. */
  preview?: Component
  /** Categoria usada no filtro da home. */
  /** Categoria (uma de `CATEGORIES`): define a cor da ferramenta, no card da home e na página dela. */
  category: string
  /** True se o módulo depende do Appwrite. */
  usesBackend: boolean
  /** Rotas do módulo, com componentes carregados sob demanda. */
  routes: RouteRecordRaw[]
}
