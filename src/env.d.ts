/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
}

declare module 'vue-confetti' {
  export interface ConfettiStartOptions {
    particles?: { type?: string; size?: number; colors?: string[] }[]
    defaultType?: string
    defaultColors?: string[]
    defaultSize?: number
    defaultDropRate?: number
    particlesPerFrame?: number
    windSpeedMax?: number
  }
  export class Confetti {
    start(options?: ConfettiStartOptions): void
    stop(): void
    remove(): void
  }
}
