export type NotifyState = NotificationPermission | 'unsupported'

export const notifyState = (): NotifyState => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

/** Pede a permissão de avisos ao navegador. Chame a partir de um clique, senão ele ignora o pedido. */
export async function askNotifyPermission(): Promise<NotifyState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/**
 * Mostra um aviso do navegador, se a pessoa permitiu. No celular o navegador só aceita avisos pelo service worker do PWA,
 * então ele vem primeiro; sem service worker, usa o aviso comum.
 */
export async function notify(title: string, body: string): Promise<void> {
  if (notifyState() !== 'granted') return
  const options: NotificationOptions = { body, icon: '/icon.svg', tag: 'canivete-pomodoro' }
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  } catch {
    // Segue para o aviso comum.
  }
  try {
    new Notification(title, options)
  } catch {
    // Sem aviso: o bipe e a mensagem na tela continuam valendo.
  }
}
