/** Altura que o calendário ocupa quando aberto, com folga (px). */
const POPOVER_ROOM_PX = 460
/** Altura do cabeçalho fixo do site, que não pode cobrir o botão depois da rolagem (px). */
const STICKY_HEADER_PX = 112

/**
 * Menus que abrem para baixo (como o calendário) viram para cima quando falta espaço e cobrem o formulário.
 * Se o elemento está perto do fim da tela, rola a página até ele ficar no alto, abaixo do cabeçalho fixo.
 * Chame antes de abrir (por exemplo em `@click.capture`).
 */
export function makeRoomBelow(event: Event, roomPx: number = POPOVER_ROOM_PX): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  const rect = el.getBoundingClientRect()
  if (window.innerHeight - rect.bottom >= roomPx) return
  window.scrollBy({ top: rect.top - STICKY_HEADER_PX, behavior: 'instant' })
}
