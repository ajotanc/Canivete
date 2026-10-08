/** Três bipes curtos pelo Web Audio. Se o navegador bloquear o som, não faz nada. */
export function beep(): void {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    for (let index = 0; index < 3; index++) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const startAt = context.currentTime + index * 0.35
      oscillator.frequency.value = 880
      gain.gain.setValueAtTime(0.2, startAt)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.25)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.25)
    }
    setTimeout(() => void context.close(), 1500)
  } catch {
    // Sem som: o aviso na tela continua valendo.
  }
}
