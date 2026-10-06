import { createAppwriteDb } from './appwriteDb.js'
import { createEntrypoint } from './entrypoint.js'

// Entrada da Appwrite Function: cria o banco real a cada execução. A chave vem de APPWRITE_API_KEY
// ou, sem ela, da chave temporária que a Appwrite gera por execução (cabeçalho x-appwrite-key).
export default createEntrypoint(({ req }) =>
  createAppwriteDb({
    ...process.env,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY || req.headers?.['x-appwrite-key'],
  }),
)
