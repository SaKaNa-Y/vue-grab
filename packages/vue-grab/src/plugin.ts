import type { App, InjectionKey } from "vue";
import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_CONFIG, mergeConfig, VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";

export const VUE_GRAB_CONFIG_KEY: InjectionKey<GrabConfig> = Symbol("vue-grab-config");

export function createVueGrab(options: Partial<GrabConfig> = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  return {
    install(app: App) {
      app.provide(VUE_GRAB_CONFIG_KEY, config);

      if (config.errorCapture.enabled && config.errorCapture.captureVueErrors) {
        const prev = app.config.errorHandler;
        app.config.errorHandler = (err, instance, info) => {
          window.dispatchEvent(
            new CustomEvent(VUE_ERROR_EVENT, {
              detail: { err, info },
            }),
          );
          prev?.(err, instance, info);
        };
      }
    },
  };
}
