/** O texto depois do id só deixa o link bonito: quem identifica o grupo é o id. */
export const invitePath = (groupId: string, slug?: string | null) =>
  `/secret-santa/g/${groupId}${slug ? `/${slug}` : ''}`
export const mePath = (groupId: string) => `/secret-santa/g/${groupId}/me`
export const adminPath = (groupId: string) => `/secret-santa/g/${groupId}/admin`

export function inviteUrl(origin: string, groupId: string, slug?: string | null): string {
  return `${origin}${invitePath(groupId, slug)}`
}

/** Lembrete para quem ainda não criou o PIN. */
export function whatsappReminderUrl(groupName: string, personName: string, inviteLink: string): string {
  const firstName = personName.split(' ')[0]
  const text = `Oi, ${firstName}! Falta você criar o seu PIN no amigo secreto "${groupName}": ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/** Um aviso só para o grupo, citando quem ainda não criou o PIN (o WhatsApp não manda em lote). */
export function whatsappPendingUrl(groupName: string, names: string[], inviteLink: string): string {
  const text = `Oi, pessoal! Ainda falta criar o PIN no amigo secreto "${groupName}": ${names.join(', ')}. Entre, escolha seu nome e crie o PIN: ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/** Aviso de que o sorteio saiu; não cita pares, só leva cada pessoa a abrir a própria carta. */
export function whatsappDrawnUrl(groupName: string, inviteLink: string): string {
  const text = `Saiu o sorteio do amigo secreto "${groupName}"! Entre, escolha seu nome e abra a sua carta: ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function whatsappUrl(groupName: string, inviteLink: string): string {
  const text = `Amigo secreto "${groupName}": entre, escolha seu nome e crie seu PIN: ${inviteLink}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
