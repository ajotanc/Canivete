export interface Address {
  cep: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
  ibge: string
  ddd: string
}

const BASE_URL = 'https://viacep.com.br/ws'

type Fetcher = typeof fetch

/** Só os dígitos do CEP. */
export const cepDigits = (text: string): string => text.replace(/\D/g, '').slice(0, 8)

/** "01310100" vira "01310-100". */
export const formatCep = (digits: string): string => (digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits)

interface ViaCepItem {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  ibge?: string
  ddd?: string
  erro?: boolean | string
}

function toAddress(item: ViaCepItem): Address {
  return {
    cep: item.cep ?? '',
    street: item.logradouro ?? '',
    complement: item.complemento ?? '',
    neighborhood: item.bairro ?? '',
    city: item.localidade ?? '',
    state: item.uf ?? '',
    ibge: item.ibge ?? '',
    ddd: item.ddd ?? '',
  }
}

async function getJson(url: string, fetcher: Fetcher): Promise<unknown> {
  const response = await fetcher(url)
  if (!response.ok) throw new Error('A consulta falhou. Tente de novo em instantes.')
  return response.json()
}

/** Endereço de um CEP de 8 dígitos; `null` se o CEP não existe. Falha de rede lança erro. */
export async function lookupCep(digits: string, fetcher: Fetcher = fetch): Promise<Address | null> {
  if (!/^\d{8}$/.test(digits)) throw new Error('O CEP tem 8 números.')
  const data = (await getJson(`${BASE_URL}/${digits}/json/`, fetcher)) as ViaCepItem
  return data.erro ? null : toAddress(data)
}

/** CEPs de uma rua: precisa de UF (2 letras), cidade e pelo menos 3 letras da rua. */
export async function searchStreet(state: string, city: string, street: string, fetcher: Fetcher = fetch): Promise<Address[]> {
  const uf = state.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(uf)) throw new Error('Informe a sigla do estado, com 2 letras.')
  if (city.trim().length < 3) throw new Error('Informe a cidade.')
  if (street.trim().length < 3) throw new Error('Digite pelo menos 3 letras da rua.')
  const path = [uf, city.trim(), street.trim()].map(encodeURIComponent).join('/')
  const data = (await getJson(`${BASE_URL}/${path}/json/`, fetcher)) as ViaCepItem[] | ViaCepItem
  return Array.isArray(data) ? data.filter((item) => !item.erro).map(toAddress) : []
}

/** Endereço em uma linha, para copiar. */
export function addressLine(address: Address): string {
  const street = [address.street, address.complement].filter(Boolean).join(' ')
  return [street, address.neighborhood, `${address.city} - ${address.state}`, `CEP ${address.cep}`].filter(Boolean).join(', ')
}
