import type {
  FloatingButtonDockEntriesConfig,
  FloatingButtonDockEntryId,
  FloatingButtonDockMode,
  FloatingButtonShortcutsConfig,
} from "@sakana-y/vue-grab-shared";
import { DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER } from "@sakana-y/vue-grab-shared";
import { tryReadStorage, trySaveStorage } from "../utils";
import { isDockMode } from "./geometry";
import { isDockEntryId } from "./definitions";

export const DEFAULT_DOCK_ENTRIES_STORAGE_KEY = "vue-grab-dock-entries";
export const DEFAULT_SHORTCUTS_STORAGE_KEY = "vue-grab-shortcuts";

export function tryReadPosition(key: string): { x: number; y: number } | null {
  return tryReadStorage(key, (raw) => {
    const { x, y } = JSON.parse(raw);
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  });
}

export function trySavePosition(key: string, x: number, y: number): void {
  trySaveStorage(key, JSON.stringify({ x, y }));
}

export function tryReadDockMode(key: string): FloatingButtonDockMode | null {
  return tryReadStorage(key, (raw) => (isDockMode(raw) ? raw : "float"));
}

export function trySaveDockMode(key: string, dockMode: FloatingButtonDockMode): void {
  trySaveStorage(key, dockMode);
}

export function tryReadBoolean(key: string): boolean | null {
  return tryReadStorage(key, (raw) => {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  });
}

export function trySaveBoolean(key: string, value: boolean): void {
  trySaveStorage(key, String(value));
}

export function tryReadString(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

export const tryReadHotkey = tryReadString;

export function tryReadEditor(key: string): string | null {
  return tryReadString(key);
}

export function trySaveEditor(key: string, editor: string): void {
  trySaveStorage(key, editor);
}

export function normalizeDockEntries(
  config: Partial<FloatingButtonDockEntriesConfig> | null | undefined,
): FloatingButtonDockEntriesConfig {
  const order: FloatingButtonDockEntryId[] = [];
  const seen = new Set<FloatingButtonDockEntryId>();
  const sourceOrder = Array.isArray(config?.order)
    ? config.order
    : DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER;
  for (const id of sourceOrder) {
    if (!isDockEntryId(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  for (const id of DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER) {
    if (seen.has(id)) continue;
    order.push(id);
  }

  const hidden: FloatingButtonDockEntryId[] = [];
  const hiddenSeen = new Set<FloatingButtonDockEntryId>();
  const sourceHidden = Array.isArray(config?.hidden) ? config.hidden : [];
  for (const id of sourceHidden) {
    if (!isDockEntryId(id) || id === "settings" || hiddenSeen.has(id)) continue;
    hiddenSeen.add(id);
    hidden.push(id);
  }

  return { order, hidden };
}

export function tryReadDockEntries(key: string): FloatingButtonDockEntriesConfig | null {
  return tryReadStorage(key, (raw) => normalizeDockEntries(JSON.parse(raw)));
}

export function trySaveDockEntries(key: string, entries: FloatingButtonDockEntriesConfig): void {
  trySaveStorage(key, JSON.stringify(entries));
}

export function normalizeShortcutCombo(combo: unknown): string | null {
  if (typeof combo !== "string") return null;
  const normalized = combo.trim();
  return normalized ? normalized : null;
}

export function normalizeShortcuts(
  config: Partial<FloatingButtonShortcutsConfig> | null | undefined,
): FloatingButtonShortcutsConfig {
  const shortcuts: FloatingButtonShortcutsConfig = {};
  const seen = new Set<string>();
  for (const id of DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER) {
    const rawCombos = Array.isArray(config?.[id]) ? config[id]! : [];
    const combos: string[] = [];
    for (const rawCombo of rawCombos) {
      const combo = normalizeShortcutCombo(rawCombo);
      if (!combo) continue;
      const key = combo.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      combos.push(combo);
    }
    if (combos.length > 0) shortcuts[id] = combos;
  }
  return shortcuts;
}

export function tryReadShortcuts(key: string): FloatingButtonShortcutsConfig | null {
  return tryReadStorage(key, (raw) => normalizeShortcuts(JSON.parse(raw)));
}

export function trySaveShortcuts(key: string, shortcuts: FloatingButtonShortcutsConfig): void {
  trySaveStorage(key, JSON.stringify(shortcuts));
}
