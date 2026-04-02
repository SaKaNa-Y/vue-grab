import type { GrabConfig } from "@sakana/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";
import { FloatingButton } from "./floating-button";

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

  hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());

  if (config.floatingButton.enabled) {
    const localFab = new FloatingButton(config.floatingButton);
    fab = localFab;
    localFab.setHighlightColor(config.highlightColor);
    localFab.setCurrentHotkey(DEFAULT_HOTKEY);
    localFab.onToggle(() => engine.toggle());
    localFab.onHotkeyChange((combo) => {
      hotkeys.destroy();
      hotkeys.register(combo, () => engine.toggle());
      localFab.setCurrentHotkey(combo);
    });
    engine.onStateChange((active) => localFab.setActive(active));
    localFab.mount();
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
