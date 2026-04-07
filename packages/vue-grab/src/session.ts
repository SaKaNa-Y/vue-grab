import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana-y/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";
import { FloatingButton } from "./floating-button";
import { updateStyle } from "./editor";

export interface GrabSession {
  engine: GrabEngine;
  hotkeys: HotkeyManager;
  fab: FloatingButton | null;
  destroy: () => void;
}

/**
 * Creates a GrabEngine + HotkeyManager pair with the default hotkey wired up.
 * Optionally creates a FloatingButton when config.floatingButton.enabled is true.
 * Shared setup used by both the Vue composable and the standalone `init()`.
 */
export function createGrabSession(config: GrabConfig): GrabSession {
  const engine = new GrabEngine(config);
  const hotkeys = new HotkeyManager();
  let fab: FloatingButton | null = null;

  if (config.floatingButton.enabled) {
    const localFab = new FloatingButton(config.floatingButton);
    fab = localFab;
    const initialHotkey = localFab.getCurrentHotkey() || DEFAULT_HOTKEY;
    hotkeys.register(initialHotkey, () => engine.toggle());
    localFab.setHighlightColor(config.highlightColor);
    localFab.setCurrentHotkey(initialHotkey);
    localFab.onToggle(() => engine.toggle());
    localFab.onHotkeyChange((combo) => {
      hotkeys.destroy();
      hotkeys.register(combo, () => engine.toggle());
      localFab.setCurrentHotkey(combo);
    });
    localFab.onConfigChange((changes) => {
      const partial = changes as Partial<GrabConfig>;
      engine.updateConfig(partial);
      if (partial.highlightColor) {
        localFab.setHighlightColor(partial.highlightColor);
      }
    });
    engine.onStateChange((active) => localFab.setActive(active));
    engine.onGrab((result) => localFab.setLastResult(result));
    localFab.mount();
  } else {
    hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());
  }

  // Wire FAB inspector style changes
  if (fab) {
    fab.onStyleChange((update) => updateStyle(update));
  }

  return {
    engine,
    hotkeys,
    fab,
    destroy() {
      engine.destroy();
      hotkeys.destroy();
      fab?.destroy();
    },
  };
}
