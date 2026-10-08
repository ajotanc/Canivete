import { formatCpf, generateCpf } from '@/modules/cpf-cnpj/lib/document'
import { secureRandomInt, type RandomInt } from '@/lib/random'

export interface Person {
  name: string
  cpf: string
  email: string
  phone: string
  /** "DD/MM/AAAA". */
  birthDate: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  cep: string
}

const FIRST_NAMES = [
  'Ana', 'Beatriz', 'Bruno', 'Camila', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Igor', 'Juliana', 'Kaique', 'Larissa', 'Lucas', 'Mariana', 'Mateus', 'Natália', 'Otávio', 'Patrícia',
  'Rafael', 'Renata', 'Rodrigo', 'Sabrina', 'Thiago', 'Vanessa', 'Vinícius', 'Yasmin', 'Joana', 'Henrique',
] as const

const LAST_NAMES = [
  'Almeida', 'Alves', 'Araújo', 'Barbosa', 'Cardoso', 'Carvalho', 'Costa', 'Dias', 'Fernandes', 'Ferreira',
  'Gomes', 'Lima', 'Martins', 'Melo', 'Monteiro', 'Moreira', 'Nascimento', 'Oliveira', 'Pereira', 'Ramos',
  'Ribeiro', 'Rocha', 'Santos', 'Silva', 'Souza', 'Teixeira', 'Vieira', 'Azevedo', 'Barros', 'Cunha',
] as const

const CITIES = [
  { city: 'São Paulo', state: 'SP', ddd: '11' },
  { city: 'Rio de Janeiro', state: 'RJ', ddd: '21' },
  { city: 'Belo Horizonte', state: 'MG', ddd: '31' },
  { city: 'Curitiba', state: 'PR', ddd: '41' },
  { city: 'Porto Alegre', state: 'RS', ddd: '51' },
  { city: 'Brasília', state: 'DF', ddd: '61' },
  { city: 'Salvador', state: 'BA', ddd: '71' },
  { city: 'Fortaleza', state: 'CE', ddd: '85' },
  { city: 'Recife', state: 'PE', ddd: '81' },
  { city: 'Manaus', state: 'AM', ddd: '92' },
  { city: 'Goiânia', state: 'GO', ddd: '62' },
  { city: 'Florianópolis', state: 'SC', ddd: '48' },
] as const

const STREETS = ['das Flores', 'Sete de Setembro', 'XV de Novembro', 'Tiradentes', 'Santos Dumont', 'das Palmeiras', 'Getúlio Vargas', 'Dom Pedro II', 'da Liberdade', 'Rui Barbosa']
const NEIGHBORHOODS = ['Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'São José', 'Bela Vista', 'Santa Luzia', 'Industrial']

const pick = <T>(list: readonly T[], random: RandomInt): T => list[random(list.length)]
const pad = (value: number, size = 2): string => String(value).padStart(size, '0')

const removeAccents = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Pessoa fictícia para testes. O CPF tem dígitos válidos, mas não pertence a ninguém;
 * o e-mail usa o domínio reservado `example.com`; o CEP é sorteado e pode não existir.
 */
export function generatePerson(random: RandomInt = secureRandomInt, now: Date = new Date()): Person {
  const first = pick(FIRST_NAMES, random)
  const last = pick(LAST_NAMES, random)
  const place = pick(CITIES, random)
  const age = 18 + random(53)
  const birth = `${pad(1 + random(28))}/${pad(1 + random(12))}/${now.getFullYear() - age}`
  const handle = `${removeAccents(first)}.${removeAccents(last)}${10 + random(90)}`.toLowerCase()
  const cep = `${pad(random(100_000), 5)}-${pad(random(1000), 3)}`
  const prefix = pick(STREETS, random)

  return {
    name: `${first} ${last}`,
    cpf: formatCpf(generateCpf(random)),
    email: `${handle}@example.com`,
    phone: `(${place.ddd}) 9${pad(random(10_000), 4)}-${pad(random(10_000), 4)}`,
    birthDate: birth,
    street: `Rua ${prefix}`,
    number: String(1 + random(2000)),
    neighborhood: pick(NEIGHBORHOODS, random),
    city: place.city,
    state: place.state,
    cep,
  }
}

export const FIELD_LABELS: ReadonlyArray<{ key: keyof Person; label: string }> = [
  { key: 'name', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'birthDate', label: 'Nascimento' },
  { key: 'street', label: 'Rua' },
  { key: 'number', label: 'Número' },
  { key: 'neighborhood', label: 'Bairro' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'cep', label: 'CEP' },
]

/** Pessoas como JSON, bom para colar em testes e mocks. */
export const peopleToJson = (people: readonly Person[]): string => JSON.stringify(people.length === 1 ? people[0] : people, null, 2)
