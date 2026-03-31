import type { App } from 'vue'
import type { GrabConfig } from '@sakana/vue-grab-shared'
import { DEFAULT_CONFIG } from '@sakana/vue-grab-shared'

export function createVueGrab(options: Partial<GrabConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }

  return {
    install(app: App) {
      app.provide('vue-grab-config', config)
    },
  }
}
