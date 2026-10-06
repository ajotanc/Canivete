import type { ToolManifest } from './types'

type ManifestModules = Record<string, { default: ToolManifest }>

/**
 * Valida os manifests encontrados e devolve a lista de ferramentas ordenada por título.
 * Lança erro em português se algum manifest estiver inválido.
 */
export function buildRegistry(modules: ManifestModules): ToolManifest[] {
  const seenIds = new Set<string>()
  const result: ToolManifest[] = []

  for (const [path, mod] of Object.entries(modules)) {
    const manifest = mod.default
    if (!manifest || !manifest.id) {
      throw new Error(`Manifest inválido em ${path}: falta o campo "id".`)
    }
    if (seenIds.has(manifest.id)) {
      throw new Error(`Id de módulo duplicado: "${manifest.id}".`)
    }
    seenIds.add(manifest.id)

    const prefix = `/${manifest.id}`
    for (const route of manifest.routes) {
      const isInsideModule = route.path === prefix || route.path.startsWith(`${prefix}/`)
      if (!isInsideModule) {
        throw new Error(
          `Rota "${route.path}" do módulo "${manifest.id}" deve começar com o prefixo "${prefix}".`,
        )
      }
    }
    result.push(manifest)
  }

  return result.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
}

// Registro real: descobre o manifest.ts de cada pasta dentro de src/modules.
export const tools: ToolManifest[] = buildRegistry(
  import.meta.glob<{ default: ToolManifest }>('/src/modules/*/manifest.ts', { eager: true }),
)
