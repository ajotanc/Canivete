/** Monta o texto que vai dentro do QR Code para cada tipo de conteúdo. */

export interface WifiData {
  ssid: string
  password: string
  security: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

export interface ContactData {
  name: string
  phone: string
  email: string
  organization: string
  url: string
}

/** Escapa os caracteres especiais do formato WIFI: \ ; , : " */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

/** Escapa os caracteres especiais de um valor vCard: \ ; , e quebra de linha. */
function escapeVcard(value: string): string {
  return value.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')
}

export function wifiPayload(data: WifiData): string {
  if (!data.ssid.trim()) return ''
  const open = data.security === 'nopass'
  const password = open ? '' : `P:${escapeWifi(data.password)};`
  const hidden = data.hidden ? 'H:true;' : ''
  return `WIFI:T:${data.security};S:${escapeWifi(data.ssid)};${password}${hidden};`
}

/** Cartão de visita (vCard 3.0): o celular oferece salvar o contato ao ler. */
export function contactPayload(data: ContactData): string {
  const name = data.name.trim()
  if (!name) return ''
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVcard(name)}`, `N:${escapeVcard(name)};;;;`]
  if (data.organization.trim()) lines.push(`ORG:${escapeVcard(data.organization.trim())}`)
  if (data.phone.trim()) lines.push(`TEL;TYPE=CELL:${data.phone.trim()}`)
  if (data.email.trim()) lines.push(`EMAIL:${data.email.trim()}`)
  if (data.url.trim()) lines.push(`URL:${data.url.trim()}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
