export const invitePath = (groupId: string) => `/secret-santa/g/${groupId}`
export const mePath = (groupId: string) => `/secret-santa/g/${groupId}/me`
export const adminPath = (groupId: string) => `/secret-santa/g/${groupId}/admin`

export function inviteUrl(origin: string, groupId: string): string {
  return `${origin}${invitePath(groupId)}`
}

/** O token vai no fragmento (#), que o navegador não envia ao servidor. */
export function adminUrl(origin: string, groupId: string, token: string): string {
  return `${origin}${adminPath(groupId)}#t=${token}`
}

export function whatsappUrl(groupName: string, inviteLink: string): string {
  const text = `Você recebeu um convite para o amigo secreto "${groupName}". Entre aqui: ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
