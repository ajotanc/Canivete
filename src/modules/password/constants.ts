export const LENGTH_MIN = 8
export const LENGTH_MAX = 64
export const LENGTH_DEFAULT = 16

export const WORDS_MIN = 3
export const WORDS_MAX = 8
export const WORDS_DEFAULT = 5

export const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%&*?+-=_',
} as const

/** Caracteres que se confundem na leitura (O/0, l/1/I). */
export const AMBIGUOUS = 'O0oIl1|'

/** 128 palavras curtas e sem acento: cada uma vale 7 bits. */
export const WORDS = [
  'abelha', 'acucar', 'aldeia', 'amigo', 'anel', 'areia', 'arroz', 'aurora', 'avenida', 'azeite', 'bala', 'balde', 'banco', 'barco', 'bolo', 'bravo',
  'cabana', 'cacau', 'cafe', 'campo', 'canto', 'carta', 'casa', 'cedro', 'cesta', 'chave', 'chuva', 'cinema', 'coral', 'corda', 'dado', 'dente',
  'doce', 'dunas', 'escada', 'espelho', 'estrela', 'farol', 'feira', 'festa', 'fogo', 'folha', 'fonte', 'forno', 'gato', 'girafa', 'goiaba', 'grama',
  'harpa', 'horta', 'ilha', 'jardim', 'jogo', 'lago', 'lapis', 'leao', 'lenha', 'limao', 'livro', 'lua', 'macaco', 'mala', 'mapa', 'mar',
  'mesa', 'milho', 'moeda', 'monte', 'mundo', 'neve', 'ninho', 'nuvem', 'onda', 'ouro', 'padaria', 'paisagem', 'palco', 'panela', 'pedra', 'peixe',
  'pente', 'pinha', 'ponte', 'porto', 'prato', 'praia', 'queijo', 'rio', 'rocha', 'roda', 'rosa', 'sabia', 'sala', 'selva', 'sino', 'sol',
  'sombra', 'sorvete', 'tapete', 'tarde', 'tigre', 'tinta', 'tomate', 'trem', 'trigo', 'uva', 'vale', 'vela', 'vento', 'verde', 'vidro', 'viola',
  'zebra', 'bambu', 'cometa', 'duna', 'ervilha', 'fada', 'gelo', 'hera', 'iogurte', 'jade', 'kiwi', 'lirio', 'manga', 'nogueira', 'opala', 'pomar',
] as const
