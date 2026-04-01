import { inject, ref, computed, onUnmounted, readonly, type DeepReadonly, type Ref, type ComputedRef } from 'vue'
import type { GrabConfig, GrabResult } from '@sakana/vue-grab-shared'
import { DEFAULT_CONFIG } from '@sakana/vue-grab-shared'
import { GrabEngine } from '../core'
import { HotkeyManager } from '../hotkeys'
import { VUE_GRAB_CONFIG_KEY } from '../plugin'

export interface UseGrabReturn {
  config: GrabConfig
  isActive: ComputedRef<boolean>
  lastResult: DeepReadonly<Ref<GrabResult | null>>
  activate: () => void
  deactivate: () => void
  toggle: () => void
}

export function useGrab(): UseGrabReturn {
  const config = inject(VUE_GRAB_CONFIG_KEY, { ...DEFAULT_CONFIG })

  const lastResult = ref<GrabResult | null>(null)

  const engine = new GrabEngine(config)
  const hotkeys = new HotkeyManager()

  const isActive = computed(() => engine.isActive)

  const unsubGrab = engine.onGrab((result) => {
    lastResult.value = result
  })

  // Default hotkey: Alt+Shift+G
  hotkeys.register('Alt+Shift+G', () => engine.toggle())

  onUnmounted(() => {
    unsubGrab()
    engine.destroy()
    hotkeys.destroy()
  })

  return {
    config,
    isActive,
    lastResult: readonly(lastResult),
    activate: () => engine.activate(),
    deactivate: () => engine.deactivate(),
    toggle: () => engine.toggle(),
  }
}
