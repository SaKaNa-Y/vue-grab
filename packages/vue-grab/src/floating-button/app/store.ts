import type { InjectionKey, Ref, ShallowRef } from "vue";

import { ref, shallowRef } from "vue";

import type { CapturedLog } from "@sakana-y/vue-grab-shared";

import type { PanelId } from "../types";

/**
 * The state bridge (ADR 0002): the reactive layer that the FloatingButton host
 * writes to and the Vue panel components read from, replacing the imperative
 * `innerHTML =` + re-`wire()` re-render cycle. The FloatingButton class stays the
 * public boundary the session wires to and forwards into this store.
 *
 * Scoped per FloatingButton instance (created in `mountFabVueApp`, provided via
 * `FAB_STORE_KEY`), not a module-global singleton.
 */
export interface FabStore {
  /** Which panel the toolbar has open; drives which Vue panel PanelHost renders. */
  readonly activePanel: Ref<PanelId | null>;
  /** Current editor preference, mirrored from FloatingButton runtime state. */
  readonly editorChoice: Ref<string>;
  /** Captured console logs, pushed in from the session's console capture. */
  readonly logs: ShallowRef<readonly CapturedLog[]>;
  /** Ask the host to clear captured logs (forwards to the session callback). */
  clearLogs(): void;
  /** Host registers the clear-logs handler. */
  onClearLogs(cb: () => void): void;
}

export const FAB_STORE_KEY: InjectionKey<FabStore> = Symbol("vue-grab-fab-store");

/**
 * Panels that render through the Vue app (PanelHost) rather than the legacy
 * `render()`/`wire()` bridge. Single source of truth for both the host's
 * `isVuePanel` check and PanelHost's render switch — extend this as panels
 * migrate (ADR 0002).
 */
export const MIGRATED_PANELS: ReadonlySet<PanelId> = new Set<PanelId>(["logs"]);

export function createFabStore(editorChoice: string): FabStore {
  const activePanel = ref<PanelId | null>(null);
  const editor = ref(editorChoice);
  const logs = shallowRef<readonly CapturedLog[]>([]);
  let clearCb: (() => void) | null = null;

  return {
    activePanel,
    editorChoice: editor,
    logs,
    clearLogs() {
      clearCb?.();
    },
    onClearLogs(cb) {
      clearCb = cb;
    },
  };
}
