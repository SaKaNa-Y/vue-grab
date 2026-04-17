import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana-y/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";
import { FloatingButton } from "./floating-button";
import { MagnifierOverlay } from "./magnifier";
import { MeasurerOverlay } from "./measurer";
import { ConsoleCapture } from "./utils";

export interface GrabSession {
  engine: GrabEngine;
  hotkeys: HotkeyManager;
  fab: FloatingButton | null;
  magnifier: MagnifierOverlay | null;
  measurer: MeasurerOverlay | null;
  consoleCapture: ConsoleCapture | null;
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
  let measurer: MeasurerOverlay | null = null;
  let consoleCapture: ConsoleCapture | null = null;

  if (config.consoleCapture.enabled) {
    consoleCapture = new ConsoleCapture(config.consoleCapture);
    consoleCapture.start();
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
      // Re-register measurer hotkey since destroy() clears all
      const mhk = localFab.getCurrentMeasurerHotkey();
      if (mhk && measurer) hotkeys.register(mhk, () => measurer!.toggle());
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
      // Mutual exclusion: deactivate magnifier and measurer when grab activates
      if (active) {
        if (magnifier?.isActive) magnifier.deactivate();
        if (measurer?.isActive) measurer.deactivate();
      }
    });
    engine.onGrab((result) => localFab.setLastResult(result));
    localFab.mount();
  } else {
    hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());
  }

  if (fab && consoleCapture) {
    consoleCapture.onChange((entries) => fab!.setLogs(entries));
    fab.onLogsClear(() => consoleCapture!.clear());
  }

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
        // Mutual exclusion: deactivate grab and measurer when magnifier activates
        if (active) {
          engine.deactivate();
          if (measurer?.isActive) measurer.deactivate();
        }
      });
    }
  }

  if (config.measurer.enabled) {
    const localMeasurer = new MeasurerOverlay(config.measurer);
    measurer = localMeasurer;
    localMeasurer.mount();

    if (fab) {
      fab.onMeasurerToggle(() => localMeasurer.toggle());
      localMeasurer.onStateChange((active) => {
        fab!.setMeasurerActive(active);
        // Mutual exclusion: deactivate grab and magnifier when measurer activates
        if (active) {
          engine.deactivate();
          if (magnifier?.isActive) magnifier.deactivate();
        }
      });

      // Measurer hotkey
      const initialMeasurerHotkey = fab.getCurrentMeasurerHotkey() || "Alt+Shift+M";
      hotkeys.register(initialMeasurerHotkey, () => localMeasurer.toggle());
      fab.setCurrentMeasurerHotkey(initialMeasurerHotkey);

      fab.onMeasurerHotkeyChange((combo) => {
        hotkeys.destroy();
        // Re-register grab hotkey
        const grabHotkey = fab.getCurrentHotkey() || DEFAULT_HOTKEY;
        hotkeys.register(grabHotkey, () => engine.toggle());
        // Register new measurer hotkey
        hotkeys.register(combo, () => localMeasurer.toggle());
        fab!.setCurrentMeasurerHotkey(combo);
      });
    }
  }

  return {
    engine,
    hotkeys,
    fab,
    magnifier,
    measurer,
    consoleCapture,
    destroy() {
      engine.destroy();
      hotkeys.destroy();
      fab?.destroy();
      magnifier?.destroy();
      measurer?.destroy();
      consoleCapture?.destroy();
    },
  };
}
