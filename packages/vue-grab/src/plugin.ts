import type { App, InjectionKey } from "vue";
import type { GrabConfig } from "@sakana/vue-grab-shared";
import { DEFAULT_CONFIG, mergeConfig } from "@sakana/vue-grab-shared";

export const VUE_GRAB_CONFIG_KEY: InjectionKey<GrabConfig> = Symbol("vue-grab-config");

export function createVueGrab(options: Partial<GrabConfig> = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  return {
    install(app: App) {
      app.provide(VUE_GRAB_CONFIG_KEY, config);
    },
  };
}
