export interface Unit {
  id: string
  label: string
  symbol: string
  /** Quantas unidades-base cabem em 1 desta unidade (fora a temperatura, que tem conta própria). */
  factor: number
}

export interface Category {
  id: string
  label: string
  units: readonly Unit[]
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'length',
    label: 'Comprimento',
    units: [
      { id: 'm', label: 'Metro', symbol: 'm', factor: 1 },
      { id: 'km', label: 'Quilômetro', symbol: 'km', factor: 1000 },
      { id: 'cm', label: 'Centímetro', symbol: 'cm', factor: 0.01 },
      { id: 'mm', label: 'Milímetro', symbol: 'mm', factor: 0.001 },
      { id: 'mi', label: 'Milha', symbol: 'mi', factor: 1609.344 },
      { id: 'yd', label: 'Jarda', symbol: 'yd', factor: 0.9144 },
      { id: 'ft', label: 'Pé', symbol: 'ft', factor: 0.3048 },
      { id: 'in', label: 'Polegada', symbol: 'in', factor: 0.0254 },
    ],
  },
  {
    id: 'mass',
    label: 'Peso',
    units: [
      { id: 'kg', label: 'Quilograma', symbol: 'kg', factor: 1 },
      { id: 'g', label: 'Grama', symbol: 'g', factor: 0.001 },
      { id: 'mg', label: 'Miligrama', symbol: 'mg', factor: 0.000001 },
      { id: 't', label: 'Tonelada', symbol: 't', factor: 1000 },
      { id: 'lb', label: 'Libra', symbol: 'lb', factor: 0.45359237 },
      { id: 'oz', label: 'Onça', symbol: 'oz', factor: 0.028349523125 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      { id: 'l', label: 'Litro', symbol: 'L', factor: 1 },
      { id: 'ml', label: 'Mililitro', symbol: 'mL', factor: 0.001 },
      { id: 'm3', label: 'Metro cúbico', symbol: 'm³', factor: 1000 },
      { id: 'cup', label: 'Xícara (240 mL)', symbol: 'xíc.', factor: 0.24 },
      { id: 'tbsp', label: 'Colher de sopa (15 mL)', symbol: 'cs', factor: 0.015 },
      { id: 'tsp', label: 'Colher de chá (5 mL)', symbol: 'cc', factor: 0.005 },
      { id: 'gal', label: 'Galão americano', symbol: 'gal', factor: 3.785411784 },
    ],
  },
  {
    id: 'area',
    label: 'Área',
    units: [
      { id: 'm2', label: 'Metro quadrado', symbol: 'm²', factor: 1 },
      { id: 'km2', label: 'Quilômetro quadrado', symbol: 'km²', factor: 1_000_000 },
      { id: 'ha', label: 'Hectare', symbol: 'ha', factor: 10_000 },
      { id: 'ft2', label: 'Pé quadrado', symbol: 'ft²', factor: 0.09290304 },
      { id: 'ac', label: 'Acre', symbol: 'ac', factor: 4046.8564224 },
    ],
  },
  {
    id: 'speed',
    label: 'Velocidade',
    units: [
      { id: 'ms', label: 'Metro por segundo', symbol: 'm/s', factor: 1 },
      { id: 'kmh', label: 'Quilômetro por hora', symbol: 'km/h', factor: 1 / 3.6 },
      { id: 'mph', label: 'Milha por hora', symbol: 'mph', factor: 0.44704 },
      { id: 'kn', label: 'Nó', symbol: 'nó', factor: 1852 / 3600 },
    ],
  },
  {
    id: 'time',
    label: 'Tempo',
    units: [
      { id: 's', label: 'Segundo', symbol: 's', factor: 1 },
      { id: 'min', label: 'Minuto', symbol: 'min', factor: 60 },
      { id: 'h', label: 'Hora', symbol: 'h', factor: 3600 },
      { id: 'd', label: 'Dia', symbol: 'dia', factor: 86_400 },
      { id: 'wk', label: 'Semana', symbol: 'sem.', factor: 604_800 },
    ],
  },
  {
    id: 'data',
    label: 'Dados',
    units: [
      { id: 'b', label: 'Byte', symbol: 'B', factor: 1 },
      { id: 'kb', label: 'Quilobyte (1.000 B)', symbol: 'kB', factor: 1000 },
      { id: 'mb', label: 'Megabyte', symbol: 'MB', factor: 1000 ** 2 },
      { id: 'gb', label: 'Gigabyte', symbol: 'GB', factor: 1000 ** 3 },
      { id: 'tb', label: 'Terabyte', symbol: 'TB', factor: 1000 ** 4 },
      { id: 'kib', label: 'Kibibyte (1.024 B)', symbol: 'KiB', factor: 1024 },
      { id: 'mib', label: 'Mebibyte', symbol: 'MiB', factor: 1024 ** 2 },
      { id: 'gib', label: 'Gibibyte', symbol: 'GiB', factor: 1024 ** 3 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperatura',
    units: [
      { id: 'c', label: 'Celsius', symbol: '°C', factor: 1 },
      { id: 'f', label: 'Fahrenheit', symbol: '°F', factor: 1 },
      { id: 'k', label: 'Kelvin', symbol: 'K', factor: 1 },
    ],
  },
]

const toCelsius: Record<string, (value: number) => number> = {
  c: (value) => value,
  f: (value) => ((value - 32) * 5) / 9,
  k: (value) => value - 273.15,
}
const fromCelsius: Record<string, (value: number) => number> = {
  c: (value) => value,
  f: (value) => (value * 9) / 5 + 32,
  k: (value) => value + 273.15,
}

export const findCategory = (id: string): Category | undefined => CATEGORIES.find((category) => category.id === id)

/** Converte `value` entre duas unidades da mesma categoria; unidade desconhecida lança erro. */
export function convert(value: number, categoryId: string, fromId: string, toId: string): number {
  const category = findCategory(categoryId)
  const from = category?.units.find((unit) => unit.id === fromId)
  const to = category?.units.find((unit) => unit.id === toId)
  if (!category || !from || !to) throw new Error(`Unidade desconhecida: ${categoryId}/${fromId}/${toId}`)
  if (categoryId === 'temperature') return fromCelsius[toId](toCelsius[fromId](value))
  return (value * from.factor) / to.factor
}

/** Número para exibir: até 6 algarismos significativos, sem zeros sobrando, em notação científica se for gigante ou minúsculo. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e12 || abs < 1e-6) return value.toExponential(4).replace('.', ',')
  return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 6 }).format(value)
}
