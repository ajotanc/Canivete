/** Limites de caracteres de lugares onde se escreve texto curto. */
export interface CharacterLimit {
  id: string
  label: string
  max: number
}

export const CHARACTER_LIMITS: readonly CharacterLimit[] = [
  { id: 'x', label: 'Post no X', max: 280 },
  { id: 'sms', label: 'SMS (1 mensagem)', max: 160 },
  { id: 'bio', label: 'Bio do Instagram', max: 150 },
  { id: 'seo-title', label: 'Título para o Google', max: 60 },
  { id: 'seo-description', label: 'Descrição para o Google', max: 160 },
]
