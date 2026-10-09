import { useStorage } from '@vueuse/core'

/**
 * Preferência de movimento. O sistema (Windows, macOS, Android, iOS) pode pedir menos movimento, e o navegador repassa
 * isso como `prefers-reduced-motion`. Nas ferramentas em que o giro É o conteúdo (moeda, dados, roleta, sorteio),
 * respeitar o pedido sem aviso faz a ferramenta parecer quebrada. Então o app respeita, avisa o que está acontecendo
 * (veja `MotionNotice.vue`) e deixa a pessoa escolher "Animar mesmo assim", escolha guardada neste aparelho.
 */
export const forceMotion = useStorage('canivete:force-motion', false)

/** O sistema ou o navegador pede menos movimento. */
export const systemReducesMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Os giros e arremessos devem ser pulados: o sistema pede menos movimento e a pessoa não escolheu animar mesmo assim. */
export const motionReduced = (): boolean => systemReducesMotion() && !forceMotion.value
