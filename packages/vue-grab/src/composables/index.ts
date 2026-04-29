import { getCurrentInstance, inject, onUnmounted, type DeepReadonly, type Ref } from "vue";
import type { GrabConfig, GrabResult } from "@sakana-y/vue-grab-shared";
import { DEFAULT_CONFIG, mergeConfig } from "@sakana-y/vue-grab-shared";
import { createVueGrabContext, VUE_GRAB_CONTEXT_KEY, type VueGrabContext } from "../plugin";

export interface UseGrabReturn {
  config: GrabConfig;
  isActive: Readonly<Ref<boolean>>;
  lastResult: DeepReadonly<Ref<GrabResult | null>>;
  isMeasurerActive: Readonly<Ref<boolean>>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  toggleMeasurer: () => void;
}

let fallbackContext: VueGrabContext | null = null;
let fallbackUsers = 0;

// Keeps useGrab() usable without app.use(createVueGrab()) and ref-counts teardown after unmount.
function getFallbackContext(): VueGrabContext {
  fallbackContext ??= createVueGrabContext(mergeConfig(DEFAULT_CONFIG, {}));
  return fallbackContext;
}

export function useGrab(): UseGrabReturn {
  const instance = getCurrentInstance();
  const provided = instance ? inject(VUE_GRAB_CONTEXT_KEY, null) : null;
  const context = provided ?? getFallbackContext();

  if (!provided && instance) {
    fallbackUsers += 1;
    onUnmounted(() => {
      fallbackUsers -= 1;
      if (fallbackUsers <= 0) {
        context.destroy();
        fallbackContext = null;
        fallbackUsers = 0;
      }
    });
  }

  return {
    config: context.config,
    isActive: context.isActive,
    lastResult: context.lastResult,
    isMeasurerActive: context.isMeasurerActive,
    activate: context.activate,
    deactivate: context.deactivate,
    toggle: context.toggle,
    toggleMeasurer: context.toggleMeasurer,
  };
}
