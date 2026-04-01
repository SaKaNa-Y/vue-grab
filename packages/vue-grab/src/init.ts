import type { GrabConfig, GrabResult } from '@sakana/vue-grab-shared'
import { DEFAULT_CONFIG, mergeConfig } from '@sakana/vue-grab-shared'
import { GrabEngine } from './core'
import { HotkeyManager } from './hotkeys'

/**
 * Standalone initialization for non-Vue contexts (e.g., script tag usage).
 */
export function init(options: Partial<GrabConfig> = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options)
  const engine = new GrabEngine(config)
  const hotkeys = new HotkeyManager()

  hotkeys.register('Alt+Shift+G', () => engine.toggle())

  return {
    activate: () => engine.activate(),
    deactivate: () => engine.deactivate(),
    onGrab: (cb: (result: GrabResult) => void) => engine.onGrab(cb),
    destroy: () => {
      engine.destroy()
      hotkeys.destroy()
    },
  }
}
