import { describe, expect, it } from 'vitest'
import { capitalizeFirst, MAX_NUMBER, moneyToWords, numberToWords } from '@/modules/amount-words/lib/words'

describe('numberToWords', () => {
  it.each([
    [0, 'zero'],
    [1, 'um'],
    [11, 'onze'],
    [19, 'dezenove'],
    [20, 'vinte'],
    [21, 'vinte e um'],
    [99, 'noventa e nove'],
    [100, 'cem'],
    [101, 'cento e um'],
    [115, 'cento e quinze'],
    [200, 'duzentos'],
    [999, 'novecentos e noventa e nove'],
  ])('%i vira "%s"', (value, text) => {
    expect(numberToWords(value)).toBe(text)
  })

  it.each([
    [1000, 'mil'],
    [1001, 'mil e um'],
    [1100, 'mil e cem'],
    [1500, 'mil e quinhentos'],
    [1234, 'mil duzentos e trinta e quatro'],
    [2000, 'dois mil'],
    [2020, 'dois mil e vinte'],
    [21_000, 'vinte e um mil'],
    [100_000, 'cem mil'],
    [123_456, 'cento e vinte e três mil quatrocentos e cinquenta e seis'],
  ])('%i vira "%s"', (value, text) => {
    expect(numberToWords(value)).toBe(text)
  })

  it.each([
    [1_000_000, 'um milhão'],
    [2_000_000, 'dois milhões'],
    [1_200_000, 'um milhão e duzentos mil'],
    [2_000_005, 'dois milhões e cinco'],
    [1_234_567, 'um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete'],
    [1_000_000_000, 'um bilhão'],
    [3_500_000_000, 'três bilhões e quinhentos milhões'],
    [MAX_NUMBER, 'novecentos e noventa e nove bilhões novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove'],
  ])('%i vira "%s"', (value, text) => {
    expect(numberToWords(value)).toBe(text)
  })

  it('rejeita negativo, decimal e acima do limite', () => {
    expect(() => numberToWords(-1)).toThrow('inteiro')
    expect(() => numberToWords(1.5)).toThrow('inteiro')
    expect(() => numberToWords(MAX_NUMBER + 1)).toThrow('inteiro')
  })
})

describe('moneyToWords', () => {
  it.each([
    [0, 'zero reais'],
    [100, 'um real'],
    [200, 'dois reais'],
    [1, 'um centavo'],
    [50, 'cinquenta centavos'],
    [101, 'um real e um centavo'],
    [123_456, 'mil duzentos e trinta e quatro reais e cinquenta e seis centavos'],
    [100_000_000, 'um milhão de reais'],
    [300_000_000_000, 'três bilhões de reais'],
    [100_000_050, 'um milhão de reais e cinquenta centavos'],
    [150_000_000, 'um milhão e quinhentos mil reais'],
  ])('%i centavos viram "%s"', (cents, text) => {
    expect(moneyToWords(cents)).toBe(text)
  })

  it('rejeita centavos inválidos', () => {
    expect(() => moneyToWords(-1)).toThrow()
    expect(() => moneyToWords(1.5)).toThrow()
  })
})

describe('capitalizeFirst', () => {
  it('põe a primeira letra em maiúscula', () => {
    expect(capitalizeFirst('mil reais')).toBe('Mil reais')
    expect(capitalizeFirst('')).toBe('')
  })
})
