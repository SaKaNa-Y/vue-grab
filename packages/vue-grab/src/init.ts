import type { GrabConfig, GrabResult } from "@sakana-y/vue-grab-shared";
import { DEFAULT_CONFIG, mergeConfig } from "@sakana-y/vue-grab-shared";
import { createGrabSession } from "./session";

/**
 * Standalone initialization for non-Vue contexts (e.g., script tag usage).
 */
export function init(options: Partial<GrabConfig> = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const session = createGrabSession(config);

  return {
    activate: () => session.engine.activate(),
    deactivate: () => session.engine.deactivate(),
    onGrab: (cb: (result: GrabResult) => void) => session.engine.onGrab(cb),
    destroy: () => session.destroy(),
  };
}
