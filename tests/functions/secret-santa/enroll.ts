import { handleAction } from '../../../functions/secret-santa/src/handler'
import type { SantaDb } from '../../../functions/secret-santa/src/types'

/** O organizador cadastra a pessoa e ela faz o primeiro acesso criando o PIN. */
export async function enroll(
  db: SantaDb,
  groupId: string,
  adminToken: string,
  person: { name: string; pin: string; wishlist?: string },
): Promise<void> {
  await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: person.name })
  await handleAction(db, { action: 'setupPin', groupId, ...person })
}
