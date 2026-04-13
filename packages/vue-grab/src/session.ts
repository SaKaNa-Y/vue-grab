import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana-y/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";
import { FloatingButton } from "./floating-button";
import { MagnifierOverlay } from "./magnifier";
import { updateStyle } from "./editor";
import { ConsoleCapture } from "./utils";

export interface GrabSession {
  engine: GrabEngine;
  hotkeys: HotkeyManager;
  fab: FloatingButton | null;
  magnifier: MagnifierOverlay | null;
  errorCapture: ConsoleCapture | null;
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
  let magnifier: MagnifierOverlay | null = null;
  let errorCapture: ConsoleCapture | null = null;

  if (config.errorCapture.enabled) {
    errorCapture = new ConsoleCapture(config.errorCapture);
    errorCapture.start();
  }

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
    engine.onStateChange((active) => {
      localFab.setActive(active);
      // Mutual exclusion: deactivate magnifier when grab activates
      if (active && magnifier?.isActive) magnifier.deactivate();
    });
    engine.onGrab((result) => localFab.setLastResult(result));
    localFab.mount();
  } else {
    hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());
  }

  // Wire FAB inspector style changes
  if (fab) {
    fab.onStyleChange((update) => updateStyle(update));
  }

  // Wire error capture to FAB
  if (fab && errorCapture) {
    errorCapture.onChange((errors) => fab!.setErrors(errors));
    fab.onErrorsClear(() => errorCapture!.clear());
  }

  // Wire magnifier
  if (config.magnifier.enabled) {
    const localMagnifier = new MagnifierOverlay(config.magnifier);
    magnifier = localMagnifier;
    localMagnifier.mount();

    if (fab) {
      fab.onMagnifierToggle(() => localMagnifier.toggle());
      fab.setMagnifierConfig({
        loupeSize: config.magnifier.loupeSize,
        zoomLevel: config.magnifier.zoomLevel,
      });
      fab.onMagnifierConfigChange((changes) => localMagnifier.updateConfig(changes));
      localMagnifier.onStateChange((active) => {
        fab!.setMagnifierActive(active);
        // Mutual exclusion: deactivate grab when magnifier activates
        if (active) engine.deactivate();
      });
    }
  }

  return {
    engine,
    hotkeys,
    fab,
    magnifier,
    errorCapture,
    destroy() {
      engine.destroy();
      hotkeys.destroy();
      fab?.destroy();
      magnifier?.destroy();
      errorCapture?.destroy();
    },
  };
}
