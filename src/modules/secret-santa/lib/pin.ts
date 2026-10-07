import { PIN_LENGTH } from '../constants'

export const isPin = (value: string): boolean => value.length === PIN_LENGTH && /^\d+$/.test(value)
