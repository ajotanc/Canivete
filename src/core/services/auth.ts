import { AppwriteException, ID, type Models } from 'appwrite'
import { readonly, ref } from 'vue'
import { getAppwrite } from './appwrite'

export interface AuthUser {
  id: string
  name: string
  email: string
}

const user = ref<AuthUser | null>(null)
const ready = ref(false)
let loadPromise: Promise<void> | null = null

/** Sessões anônimas antigas não têm e-mail: contam como "sem login". */
function toUser(model: Models.User<Models.Preferences>): AuthUser | null {
  return model.email ? { id: model.$id, name: model.name, email: model.email } : null
}

/** Mensagem em português para os erros mais comuns do Appwrite Auth. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    if (error.code === 401) return 'E-mail ou senha incorretos.'
    if (error.code === 409) return 'Já existe uma conta com esse e-mail. Entre com ela.'
    if (error.code === 429) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
    if (error.code === 400) return 'Confira o e-mail e use uma senha de pelo menos 8 caracteres.'
  }
  return 'Não foi possível falar com o servidor. Tente novamente em instantes.'
}

/** Lê a sessão atual uma única vez; as próximas chamadas reaproveitam o resultado. */
export function loadUser(): Promise<void> {
  loadPromise ??= (async () => {
    try {
      user.value = toUser(await getAppwrite().account.get())
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  })()
  return loadPromise
}

async function startSession(email: string, password: string): Promise<void> {
  const { account } = getAppwrite()
  // Uma sessão antiga (ex.: anônima) impede criar outra.
  await account.deleteSession({ sessionId: 'current' }).catch(() => {})
  await account.createEmailPasswordSession({ email, password })
  user.value = toUser(await account.get())
}

export async function login(email: string, password: string): Promise<void> {
  await startSession(email.trim(), password)
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await getAppwrite().account.create({ userId: ID.unique(), email: email.trim(), password, name: name.trim() })
  await startSession(email, password)
}

export async function logout(): Promise<void> {
  await getAppwrite().account.deleteSession({ sessionId: 'current' }).catch(() => {})
  user.value = null
}

/** Estado de login para os componentes. */
export function useAuth() {
  void loadUser()
  return { user: readonly(user), ready: readonly(ready), login, register, logout }
}

/** Limpa o estado em cache. Usado apenas nos testes. */
export function resetAuthForTests(): void {
  user.value = null
  ready.value = false
  loadPromise = null
}
