import type { GrabConfig } from '@sakana/vue-grab-shared'
import { DEFAULT_CONFIG } from '@sakana/vue-grab-shared'

/**
 * Standalone initialization for non-Vue contexts (e.g., script tag usage).
 */
export function init(options: Partial<GrabConfig> = {}) {
  const _config = { ...DEFAULT_CONFIG, ...options }
  // TODO: Initialize grab functionality without Vue plugin
}
