import { readonly, ref, type App, type DeepReadonly, type InjectionKey, type Ref } from "vue";
import type { GrabConfig, GrabResult, GrabUserConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_CONFIG, mergeConfig, VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";
import { createGrabSession, type GrabSession } from "./session";

export const VUE_GRAB_CONFIG_KEY: InjectionKey<GrabConfig> = Symbol("vue-grab-config");

export interface VueGrabContext {
  config: GrabConfig;
  isActive: Readonly<Ref<boolean>>;
  lastResult: DeepReadonly<Ref<GrabResult | null>>;
  isMeasurerActive: Readonly<Ref<boolean>>;
  ensureSession: () => GrabSession | null;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  toggleMeasurer: () => void;
  destroy: () => void;
}

export const VUE_GRAB_CONTEXT_KEY: InjectionKey<VueGrabContext> = Symbol("vue-grab-context");

function canUseDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function createVueGrabContext(config: GrabConfig): VueGrabContext {
  const isActive = ref(false);
  const lastResult = ref<GrabResult | null>(null);
  const isMeasurerActive = ref(false);
  let session: GrabSession | null = null;
  let cleanups: Array<() => void> = [];

  const ensureSession = (): GrabSession | null => {
    if (session) return session;
    if (!canUseDOM()) return null;

    session = createGrabSession(config);
    cleanups = [
      session.engine.onGrab((result) => {
        lastResult.value = result;
      }),
      session.engine.onStateChange((active) => {
        isActive.value = active;
      }),
    ];
    if (session.measurer) {
      cleanups.push(
        session.measurer.onStateChange((active) => {
          isMeasurerActive.value = active;
        }),
      );
    }
    isActive.value = session.engine.isActive;
    isMeasurerActive.value = session.measurer?.isActive ?? false;
    return session;
  };

  const destroy = (): void => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    session?.destroy();
    session = null;
    isActive.value = false;
    isMeasurerActive.value = false;
  };

  return {
    config,
    isActive: readonly(isActive),
    lastResult: readonly(lastResult),
    isMeasurerActive: readonly(isMeasurerActive),
    ensureSession,
    activate: () => ensureSession()?.engine.activate(),
    deactivate: () => ensureSession()?.engine.deactivate(),
    toggle: () => ensureSession()?.engine.toggle(),
    toggleMeasurer: () => ensureSession()?.measurer?.toggle(),
    destroy,
  };
}

export function createVueGrab(options: GrabUserConfig = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const context = createVueGrabContext(config);

  return {
    install(app: App) {
      app.provide(VUE_GRAB_CONFIG_KEY, config);
      app.provide(VUE_GRAB_CONTEXT_KEY, context);

      const originalMount = app.mount.bind(app);
      app.mount = ((...args: Parameters<App["mount"]>) => {
        if (canUseDOM()) context.ensureSession();
        try {
          return originalMount(...args);
        } catch (err) {
          context.destroy();
          throw err;
        }
      }) as App["mount"];

      const originalUnmount = app.unmount.bind(app);
      app.unmount = () => {
        try {
          originalUnmount();
        } finally {
          context.destroy();
        }
      };

      if (config.consoleCapture.enabled && config.consoleCapture.captureVueErrors) {
        const prev = app.config.errorHandler;
        app.config.errorHandler = (err, instance, info) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent(VUE_ERROR_EVENT, {
                detail: { err, info },
              }),
            );
          }
          prev?.(err, instance, info);
        };
      }
    },
  };
}
