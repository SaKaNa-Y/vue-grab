import { inject } from 'vue'
import type { GrabConfig } from '@sakana/vue-grab-shared'
import { DEFAULT_CONFIG } from '@sakana/vue-grab-shared'

export function useGrab() {
  const config = inject<GrabConfig>('vue-grab-config', { ...DEFAULT_CONFIG })

  return {
    config,
  }
}
