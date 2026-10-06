import { createAppwriteDb } from './appwriteDb.js'
import { createEntrypoint } from './entrypoint.js'

// Entrada da Appwrite Function: cria o banco real a cada execução, a partir das variáveis de ambiente.
export default createEntrypoint(() => createAppwriteDb(process.env))
