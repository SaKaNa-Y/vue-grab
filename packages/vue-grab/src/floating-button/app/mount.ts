import { ConfigProvider } from "reka-ui";
import { createApp, h } from "vue";

import PanelHost from "./PanelHost.vue";
import { createFabStore, FAB_STORE_KEY, type FabStore } from "./store";

export interface FabVueApp {
  readonly store: FabStore;
  unmount(): void;
}

/**
 * Mount the FloatingButton Vue app into a container inside the shadow root
 * (ADR 0002). A reka-ui `ConfigProvider` sets `teleportTo` to an in-shadow
 * element so portalled overlays (dropdowns/tooltips) stay within the shadow root
 * instead of escaping to `document.body`.
 */
export function mountFabVueApp(
  mountEl: HTMLElement,
  teleportEl: HTMLElement,
  editorChoice: string,
): FabVueApp {
  const store = createFabStore(editorChoice);
  const app = createApp({
    setup() {
      return () => h(ConfigProvider, { teleportTo: teleportEl }, () => h(PanelHost));
    },
  });
  app.provide(FAB_STORE_KEY, store);
  app.mount(mountEl);
  return {
    store,
    unmount: () => app.unmount(),
  };
}
