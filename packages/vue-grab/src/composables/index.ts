import { inject, ref, onUnmounted, readonly, type DeepReadonly, type Ref } from "vue";
import type { GrabConfig, GrabResult } from "@sakana-y/vue-grab-shared";
import { DEFAULT_CONFIG } from "@sakana-y/vue-grab-shared";
import { createGrabSession } from "../session";
import { VUE_GRAB_CONFIG_KEY } from "../plugin";

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

export function useGrab(): UseGrabReturn {
  const config = inject(VUE_GRAB_CONFIG_KEY, { ...DEFAULT_CONFIG });

  const isActive = ref(false);
  const lastResult = ref<GrabResult | null>(null);
  const isMeasurerActive = ref(false);

  const session = createGrabSession(config);
  const { engine } = session;

  const unsubGrab = engine.onGrab((result) => {
    lastResult.value = result;
  });

  const unsubState = engine.onStateChange((active) => {
    isActive.value = active;
  });

  let unsubMeasurer: (() => void) | undefined;
  if (session.measurer) {
    unsubMeasurer = session.measurer.onStateChange((active) => {
      isMeasurerActive.value = active;
    });
  }

  onUnmounted(() => {
    unsubGrab();
    unsubState();
    unsubMeasurer?.();
    session.destroy();
  });

  return {
    config,
    isActive: readonly(isActive),
    lastResult: readonly(lastResult),
    isMeasurerActive: readonly(isMeasurerActive),
    activate: () => engine.activate(),
    deactivate: () => engine.deactivate(),
    toggle: () => engine.toggle(),
    toggleMeasurer: () => session.measurer?.toggle(),
  };
}
