import { STORAGE } from '../constants'

export interface SessionCredentials {
  name: string
  pin: string
}

const credKey = (groupId: string) => `${STORAGE.credentialsPrefix}${groupId}`

/** Guarda nome e PIN só na sessão da aba (some ao fechar). O PIN nunca vai para o localStorage. */
export function saveCredentials(groupId: string, credentials: SessionCredentials): void {
  try {
    sessionStorage.setItem(credKey(groupId), JSON.stringify(credentials))
  } catch {
    // Storage indisponível: a pessoa precisará entrar de novo ao recarregar.
  }
}

export function loadCredentials(groupId: string): SessionCredentials | null {
  try {
    const raw = sessionStorage.getItem(credKey(groupId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.name === 'string' && typeof parsed?.pin === 'string') return parsed
  } catch {
    // Valor corrompido ou storage indisponível.
  }
  return null
}

export function clearCredentials(groupId: string): void {
  try {
    sessionStorage.removeItem(credKey(groupId))
  } catch {
    // Nada a limpar.
  }
}
