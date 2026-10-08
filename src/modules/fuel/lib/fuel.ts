export interface FuelInput {
  /** Preço por litro. */
  gasoline: number
  ethanol: number
  /** Km por litro; se faltar um dos dois, vale a regra dos 70%. */
  gasolineKmL?: number | null
  ethanolKmL?: number | null
  /** Distância da viagem, em km. */
  distanceKm?: number | null
}

export type Winner = 'ethanol' | 'gasoline' | 'tie'

export interface FuelResult {
  /** Preço do etanol dividido pelo da gasolina. */
  ratio: number
  /** Abaixo disso o etanol compensa: 0,70 pela regra, ou o rendimento relativo do carro. */
  breakEven: number
  usesConsumption: boolean
  winner: Winner
  /** Quanto o vencedor economiza por km (em %), só com os consumos. */
  savingPercent: number | null
  costPerKm: { gasoline: number; ethanol: number } | null
  trip: { gasoline: number; ethanol: number } | null
}

/** A regra de bolso: etanol compensa se custa até 70% da gasolina. */
export const RULE_OF_THUMB = 0.7

const positive = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

/** Compara os dois combustíveis; preços inválidos lançam erro. */
export function compareFuel(input: FuelInput): FuelResult {
  if (!positive(input.gasoline) || !positive(input.ethanol)) throw new Error('Informe os dois preços, maiores que zero.')
  const ratio = input.ethanol / input.gasoline
  const usesConsumption = positive(input.gasolineKmL) && positive(input.ethanolKmL)

  let breakEven = RULE_OF_THUMB
  let costPerKm: FuelResult['costPerKm'] = null
  if (usesConsumption) {
    breakEven = (input.ethanolKmL as number) / (input.gasolineKmL as number)
    costPerKm = { gasoline: input.gasoline / (input.gasolineKmL as number), ethanol: input.ethanol / (input.ethanolKmL as number) }
  }

  // A margem de 1e-9 evita um "empate falso" por arredondamento de ponto flutuante.
  const diff = ratio - breakEven
  const winner: Winner = Math.abs(diff) < 1e-9 ? 'tie' : diff < 0 ? 'ethanol' : 'gasoline'

  let savingPercent: number | null = null
  if (costPerKm) {
    const cheap = Math.min(costPerKm.gasoline, costPerKm.ethanol)
    const dear = Math.max(costPerKm.gasoline, costPerKm.ethanol)
    savingPercent = ((dear - cheap) / dear) * 100
  }

  const trip = costPerKm && positive(input.distanceKm) ? { gasoline: costPerKm.gasoline * input.distanceKm, ethanol: costPerKm.ethanol * input.distanceKm } : null
  return { ratio, breakEven, usesConsumption, winner, savingPercent, costPerKm, trip }
}
