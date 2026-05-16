import type { FloatingButtonShortcutCommandId } from "@sakana-y/vue-grab-shared";

import type { FloatingButton } from "../floating-button";
import type { HotkeyManager } from "../hotkeys";

export interface Disposable {
  destroy(): void;
}

export interface ToggleableTool extends Disposable {
  readonly isActive: boolean;
  activate(): void;
  deactivate(): void;
  toggle(): void;
  onStateChange(cb: (active: boolean) => void): () => void;
}

export interface PanelRenderer<TContext = void> {
  render(context: TContext): string;
}

export function registerFloatingButtonShortcuts(
  hotkeys: HotkeyManager,
  targetFab: FloatingButton,
): void {
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
}

export function destroyAll(items: Array<{ destroy: () => void } | null | undefined>): void {
  for (const item of items) item?.destroy();
}
