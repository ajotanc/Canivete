/** O campo de PIN da interface tem sempre 4 casas; o servidor ainda aceita 4 a 6 números de PINs antigos. */
export const PIN_LENGTH = 4

export const isPin = (value: string): boolean => value.length === PIN_LENGTH && /^\d+$/.test(value)
