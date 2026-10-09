import { describe, expect, it } from 'vitest'

/**
 * As caixas `glass` do cabeçalho (FactTile) têm rótulo e valor numa linha só, num celular de 360px:
 * sobram 83px de texto em cada caixa. Sem navegador não dá para medir o DOM, então o teste soma a largura
 * de cada letra, medida no Chrome com a fonte do app (Onest; valor em 600 a 16px, rótulo em 400 a 12px;
 * dígitos tabulares). Texto com `{{ }}` é dinâmico e fica de fora: nele, deixe só o número no valor.
 * Se mudar a fonte, o tamanho ou o respiro da caixa, meça de novo.
 */
const ROOM = 83
const VALUE_WIDTHS: Record<string, number> = {"0":10.77,"1":10.77,"2":10.77,"3":10.77,"4":10.77,"5":10.77,"6":10.77,"7":10.77,"8":10.77,"9":10.77," ":4.45,"a":9.01,"b":9.87,"c":8.94,"d":9.89,"e":9.18,"f":6.05,"g":9.89,"h":9.6,"i":3.84,"j":4.21,"k":8.74,"l":3.84,"m":13.46,"n":9.6,"o":9.55,"p":9.87,"q":9.89,"r":6.18,"s":8.18,"t":5.89,"u":9.31,"v":8.8,"w":13.74,"x":8.72,"y":9.76,"z":8.21,"A":11.17,"B":10.7,"C":11.38,"D":11.63,"E":9.89,"F":9.63,"G":11.65,"H":11.79,"I":4.53,"J":9.22,"K":10.51,"L":9.39,"M":14.16,"N":12.13,"O":12.3,"P":10.34,"Q":12.3,"R":10.86,"S":10.51,"T":9.38,"U":11.74,"V":11.26,"W":15.95,"X":10.29,"Y":10.54,"Z":9.78,"á":9.01,"à":9.01,"â":9.01,"ã":9.01,"é":9.18,"ê":9.18,"í":3.84,"ó":9.55,"ô":9.55,"õ":9.55,"ú":9.31,"ç":8.94,"Á":11.17,"É":9.89,"Í":4.53,"Ó":12.3,"Ú":11.74,"Ç":11.38,".":4.35,",":4.61,":":4.38,";":4.59,"!":4.7,"?":8.38,"%":13.74,"$":10.58,"/":8.02,"(":5.41,")":5.41,"+":9.25,"-":7.39,"–":9.62,"·":4.37,"&":11.26}
const LABEL_WIDTHS: Record<string, number> = {"0":8.06,"1":8.06,"2":8.06,"3":8.06,"4":8.06,"5":8.06,"6":8.06,"7":8.06,"8":8.06,"9":8.06," ":3.24,"a":6.66,"b":7.25,"c":6.64,"d":7.25,"e":6.88,"f":4.39,"g":7.25,"h":7.09,"i":2.63,"j":3.05,"k":6.24,"l":2.63,"m":9.83,"n":7.09,"o":7.14,"p":7.25,"q":7.25,"r":4.48,"s":6.11,"t":4.44,"u":6.91,"v":6.43,"w":10.12,"x":6.18,"y":7.16,"z":6.22,"A":8.04,"B":7.86,"C":8.45,"D":8.64,"E":7.32,"F":7.19,"G":8.64,"H":8.72,"I":3.13,"J":6.7,"K":7.5,"L":6.89,"M":10.27,"N":8.89,"O":9.13,"P":7.56,"Q":9.13,"R":7.9,"S":7.82,"T":6.83,"U":8.71,"V":8.2,"W":11.8,"X":7.12,"Y":7.37,"Z":7.16,"á":6.66,"à":6.66,"â":6.66,"ã":6.66,"é":6.88,"ê":6.88,"í":2.63,"ó":7.14,"ô":7.14,"õ":7.14,"ú":6.91,"ç":6.64,"Á":8.04,"É":7.32,"Í":3.13,"Ó":9.13,"Ú":8.71,"Ç":8.45,".":3.05,",":3.13,":":3.04,";":3.13,"!":3.28,"?":6.16,"%":9.65,"$":7.87,"/":5.72,"(":3.7,")":3.7,"+":6.6,"-":5.5,"–":6.94,"·":2.99,"&":8.12}
/** Letra fora da tabela conta como a mais larga, para nunca deixar passar. */
const width = (text: string, table: Record<string, number>) => [...text].reduce((sum, char) => sum + (table[char] ?? 14.2), 0)

const sources = import.meta.glob<string>('/src/**/*.vue', { query: '?raw', import: 'default', eager: true })

const tiles = Object.entries(sources).flatMap(([file, source]) =>
  [...source.matchAll(/<FactTile\b([^>]*)>([^<]*)<\/FactTile>/g)]
    .filter(([, attrs]) => !/tone="paper"/.test(attrs))
    .map(([, attrs, value]) => ({ file: file.replace('/src/modules/', ''), label: /\blabel="([^"]*)"/.exec(attrs)?.[1] ?? null, value: value.trim() })),
)

describe('caixas de fato do cabeçalho', () => {
  it('encontra as caixas das ferramentas', () => {
    expect(tiles.length).toBeGreaterThan(40)
  })

  it.each(tiles.filter((tile) => tile.label !== null))('$file: rótulo "$label" cabe numa linha', ({ label }) => {
    expect(width(label!, LABEL_WIDTHS)).toBeLessThanOrEqual(ROOM)
  })

  it.each(tiles.filter((tile) => !tile.value.includes('{{')))('$file: valor "$value" cabe numa linha', ({ value }) => {
    expect(width(value, VALUE_WIDTHS)).toBeLessThanOrEqual(ROOM)
  })

  it('bate com o que o navegador mediu', () => {
    for (const fits of ['Português', '11 opções', 'Mudanças', 'Verificável', 'Dias úteis']) expect(width(fits, VALUE_WIDTHS), fits).toBeLessThanOrEqual(ROOM)
    for (const breaks of ['CEP ou rua', 'Compostos', 'R$ 150,00', 'Wi-Fi e mais', '999 pontos']) expect(width(breaks, VALUE_WIDTHS), breaks).toBeGreaterThan(ROOM)
  })
})
