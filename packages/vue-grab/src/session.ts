import type { FloatingButtonShortcutCommandId, GrabConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana-y/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";
import { FloatingButton } from "./floating-button";
import { MagnifierOverlay } from "./magnifier";
import { MeasurerOverlay } from "./measurer";
import { ConsoleCapture, NetworkCapture } from "./utils";

export interface GrabSession {
  engine: GrabEngine;
  hotkeys: HotkeyManager;
  fab: FloatingButton | null;
  magnifier: MagnifierOverlay | null;
  measurer: MeasurerOverlay | null;
  consoleCapture: ConsoleCapture | null;
  networkCapture: NetworkCapture | null;
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
  let networkCapture: NetworkCapture | null = null;

  const registerFabShortcuts = (targetFab: FloatingButton): void => {
    hotkeys.destroy();
    const shortcuts = targetFab.getShortcuts();
    for (const [id, combos] of Object.entries(shortcuts) as [
      FloatingButtonShortcutCommandId,
      string[],
    ][]) {
      for (const combo of combos) {
        hotkeys.register(combo, () => targetFab.triggerShortcut(id));
      }
    }
  };

  if (config.consoleCapture.enabled) {
    consoleCapture = new ConsoleCapture(config.consoleCapture);
    consoleCapture.start();
  }

  if (config.networkCapture.enabled) {
    networkCapture = new NetworkCapture(config.networkCapture);
    networkCapture.start();
    if (config.networkCapture.grabSnapshot.enabled) {
      const nc = networkCapture;
      engine.addResultEnricher((result) => {
        result.network = nc.getSnapshotForGrab();
      });
    }
  }

  if (config.floatingButton.enabled) {
    const localFab = new FloatingButton(config.floatingButton);
    fab = localFab;
    const initialHotkey = localFab.getCurrentHotkey() || DEFAULT_HOTKEY;
    localFab.setHighlightColor(config.highlightColor);
    localFab.setCurrentHotkey(initialHotkey);
    localFab.onToggle(() => engine.toggle());
    localFab.onShortcutsChange(() => registerFabShortcuts(localFab));
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
    registerFabShortcuts(localFab);
  } else {
    hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());
  }

  if (fab && consoleCapture) {
    consoleCapture.onChange((entries) => fab!.setLogs(entries));
    fab.onLogsClear(() => consoleCapture!.clear());
  }

  if (fab && networkCapture) {
    networkCapture.onChange((entries) => fab!.setNetwork(entries));
    fab.onNetworkClear(() => networkCapture!.clear());
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
    }
  }

  return {
    engine,
    hotkeys,
    fab,
    magnifier,
    measurer,
    consoleCapture,
    networkCapture,
    destroy() {
      engine.destroy();
      hotkeys.destroy();
      fab?.destroy();
      magnifier?.destroy();
      measurer?.destroy();
      consoleCapture?.destroy();
      networkCapture?.destroy();
    },
  };
}
