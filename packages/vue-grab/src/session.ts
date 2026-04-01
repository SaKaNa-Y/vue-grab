import type { GrabConfig, GrabResult } from "@sakana/vue-grab-shared";
import { DEFAULT_HOTKEY } from "@sakana/vue-grab-shared";
import { GrabEngine } from "./core";
import { HotkeyManager } from "./hotkeys";

export interface GrabSession {
  engine: GrabEngine;
  hotkeys: HotkeyManager;
  destroy: () => void;
}

/**
 * Creates a GrabEngine + HotkeyManager pair with the default hotkey wired up.
 * Shared setup used by both the Vue composable and the standalone `init()`.
 */
export function createGrabSession(config: GrabConfig): GrabSession {
  const engine = new GrabEngine(config);
  const hotkeys = new HotkeyManager();

  hotkeys.register(DEFAULT_HOTKEY, () => engine.toggle());

  return {
    engine,
    hotkeys,
    destroy() {
      engine.destroy();
      hotkeys.destroy();
    },
  };
}
