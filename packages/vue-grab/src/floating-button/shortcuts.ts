import type {
  FloatingButtonConfig,
  FloatingButtonShortcutCommandId,
  FloatingButtonShortcutsConfig,
} from "@sakana-y/vue-grab-shared";

import {
  DEFAULT_FLOATING_BUTTON,
  DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
} from "@sakana-y/vue-grab-shared";

import type { PanelId, TabId } from "./types";

import { buildCombo } from "../hotkeys";
import { esc } from "../utils";
import { SHORTCUT_COMMAND_DEFINITIONS, isDockEntryId } from "./definitions";
import {
  DEFAULT_SHORTCUTS_STORAGE_KEY,
  normalizeShortcutCombo,
  normalizeShortcuts,
  tryReadHotkey,
  tryReadShortcuts,
  trySaveShortcuts,
} from "./storage";

export interface FloatingButtonShortcutsControllerOptions {
  getActivePanel: () => PanelId | null;
  getSettingsTab: () => TabId;
  renderExpandBody: () => void;
}

export class FloatingButtonShortcutsController {
  private shortcuts: FloatingButtonShortcutsConfig;
  private storageKey: string;
  private recordingId: FloatingButtonShortcutCommandId | null = null;
  private error: { id: FloatingButtonShortcutCommandId; message: string } | null = null;
  private boundRecordKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private shortcutsChangeCb: ((shortcuts: FloatingButtonShortcutsConfig) => void) | null = null;
  private hotkeyChangeCb: ((combo: string) => void) | null = null;
  private measurerHotkeyChangeCb: ((combo: string) => void) | null = null;

  constructor(
    config: FloatingButtonConfig,
    private readonly options: FloatingButtonShortcutsControllerOptions,
  ) {
    this.storageKey = config.shortcutsStorageKey ?? DEFAULT_SHORTCUTS_STORAGE_KEY;
    const storedShortcuts = tryReadShortcuts(this.storageKey);
    this.shortcuts =
      storedShortcuts ??
      normalizeShortcutsWithLegacy(
        { ...DEFAULT_FLOATING_BUTTON.shortcuts, ...config.shortcuts },
        config.hotkeyStorageKey,
        config.measurerHotkeyStorageKey,
      );
  }

  get isRecording(): boolean {
    return this.recordingId !== null;
  }

  getCurrentHotkey(): string {
    return this.getCombos("grab")[0] ?? "";
  }

  getCurrentMeasurerHotkey(): string {
    return this.getCombos("measurer")[0] ?? "";
  }

  getShortcuts(): FloatingButtonShortcutsConfig {
    return cloneShortcuts(this.shortcuts);
  }

  getCombos(id: FloatingButtonShortcutCommandId): string[] {
    return [...(this.shortcuts[id] ?? [])];
  }

  setFirst(id: FloatingButtonShortcutCommandId, combo: string, persist: boolean): void {
    const next = cloneShortcuts(this.shortcuts);
    const current = next[id] ?? [];
    const normalized = normalizeShortcutCombo(combo);
    if (normalized)
      next[id] = [
        normalized,
        ...current.filter((value) => value.toLowerCase() !== normalized.toLowerCase()).slice(1),
      ];
    else delete next[id];
    this.commit(next, persist, false);
  }

  onShortcutsChange(cb: (shortcuts: FloatingButtonShortcutsConfig) => void): void {
    this.shortcutsChangeCb = cb;
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.hotkeyChangeCb = cb;
  }

  onMeasurerHotkeyChange(cb: (combo: string) => void): void {
    this.measurerHotkeyChangeCb = cb;
  }

  renderRows(): string {
    return SHORTCUT_COMMAND_DEFINITIONS.map((command) => {
      const combos = this.getCombos(command.id);
      const isRecording = this.recordingId === command.id;
      const error = this.error && this.error.id === command.id ? this.error.message : "";
      const chips =
        combos.length > 0
          ? combos
              .map((combo, index) => {
                const label =
                  command.legacyKbdClass && index === 0
                    ? `<span class="${command.legacyKbdClass}">${esc(combo)}</span>`
                    : esc(combo);
                return `<span class="shortcut-chip" data-shortcut-chip="${command.id}" data-shortcut-combo="${esc(combo)}">${label}<button class="shortcut-remove-btn" type="button" data-shortcut-remove="${command.id}" data-shortcut-combo="${esc(combo)}" aria-label="Remove ${esc(combo)} shortcut">&times;</button></span>`;
              })
              .join("")
          : '<span class="shortcut-empty">Add shortcut</span>';
      return `
        <div class="setting-row shortcut-row" data-settings-row="${command.id}-shortcut" data-shortcut-row="${command.id}">
          <span class="setting-row-icon">${command.icon}</span>
          <span class="setting-row-copy">
            <span class="setting-row-title">${esc(command.label)}</span>
            <span class="setting-row-description">${esc(command.description)}</span>
          </span>
          <span class="setting-row-control shortcut-controls">
            ${chips}
            ${
              isRecording
                ? `<span class="shortcut-chip shortcut-recording-chip">Press keys...</span><button class="record-btn${command.legacyRecordClass ? ` ${command.legacyRecordClass}` : ""}" type="button" data-shortcut-record="${command.id}">Cancel</button>`
                : `<button class="record-btn${command.legacyRecordClass ? ` ${command.legacyRecordClass}` : ""}" type="button" data-shortcut-record="${command.id}">Add shortcut</button>`
            }
            ${error ? `<span class="shortcut-error">${esc(error)}</span>` : ""}
          </span>
        </div>
      `;
    }).join("");
  }

  wire(root: HTMLElement): void {
    for (const btn of root.querySelectorAll<HTMLElement>("[data-shortcut-record]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.shortcutRecord;
        if (!isDockEntryId(id)) return;
        this.toggleRecording(id);
      });
    }

    for (const btn of root.querySelectorAll<HTMLElement>("[data-shortcut-remove]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.shortcutRemove;
        const combo = btn.dataset.shortcutCombo;
        if (!isDockEntryId(id) || !combo) return;
        this.remove(id, combo);
      });
    }
  }

  stopRecording(): void {
    if (!this.recordingId && !this.boundRecordKeyDown) return;
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
    this.recordingId = null;
    this.options.renderExpandBody();
  }

  destroy(): void {
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
  }

  private hasCombo(combo: string, except?: FloatingButtonShortcutCommandId): boolean {
    const needle = combo.toLowerCase();
    return DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER.some(
      (id) =>
        id !== except && (this.shortcuts[id] ?? []).some((value) => value.toLowerCase() === needle),
    );
  }

  private persist(): void {
    trySaveShortcuts(this.storageKey, this.shortcuts);
  }

  private commit(shortcuts: FloatingButtonShortcutsConfig, persist: boolean, emit = true): void {
    const previousGrab = this.shortcuts.grab?.[0] ?? "";
    const previousMeasurer = this.shortcuts.measurer?.[0] ?? "";
    this.shortcuts = normalizeShortcuts(shortcuts);
    if (persist) this.persist();
    if (
      this.options.getActivePanel() === "settings" &&
      this.options.getSettingsTab() === "shortcuts"
    ) {
      this.options.renderExpandBody();
    }
    if (!emit) return;
    const snapshot = cloneShortcuts(this.shortcuts);
    this.shortcutsChangeCb?.(snapshot);
    const nextGrab = snapshot.grab?.[0] ?? "";
    const nextMeasurer = snapshot.measurer?.[0] ?? "";
    if (nextGrab !== previousGrab) this.hotkeyChangeCb?.(nextGrab);
    if (nextMeasurer !== previousMeasurer) this.measurerHotkeyChangeCb?.(nextMeasurer);
  }

  private add(id: FloatingButtonShortcutCommandId, combo: string): boolean {
    const normalized = normalizeShortcutCombo(combo);
    if (!normalized) return false;
    if (this.hasCombo(normalized, id)) {
      this.error = { id, message: "Already used by another feature" };
      this.options.renderExpandBody();
      return false;
    }
    const next = cloneShortcuts(this.shortcuts);
    const existing = next[id] ?? [];
    if (!existing.some((value) => value.toLowerCase() === normalized.toLowerCase())) {
      next[id] = [...existing, normalized];
    }
    this.error = null;
    this.commit(next, true);
    return true;
  }

  private remove(id: FloatingButtonShortcutCommandId, combo: string): void {
    const next = cloneShortcuts(this.shortcuts);
    const remaining = (next[id] ?? []).filter((value) => value !== combo);
    if (remaining.length > 0) next[id] = remaining;
    else delete next[id];
    this.error = null;
    this.commit(next, true);
  }

  private toggleRecording(id: FloatingButtonShortcutCommandId): void {
    if (this.recordingId === id) this.stopRecording();
    else this.startRecording(id);
  }

  private startRecording(id: FloatingButtonShortcutCommandId): void {
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
    this.recordingId = id;
    this.error = null;
    this.options.renderExpandBody();

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) return;
      const combo = buildCombo(e);
      const recordedId = this.recordingId;
      if (!recordedId) return;
      this.recordingId = null;
      this.boundRecordKeyDown = null;
      this.add(recordedId, combo);
      document.removeEventListener("keydown", handler, { capture: true });
    };

    this.boundRecordKeyDown = handler;
    document.addEventListener("keydown", handler, { capture: true });
  }
}

export function cloneShortcuts(
  shortcuts: FloatingButtonShortcutsConfig,
): FloatingButtonShortcutsConfig {
  const clone: FloatingButtonShortcutsConfig = {};
  for (const id of DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER) {
    const combos = shortcuts[id];
    if (combos?.length) clone[id] = [...combos];
  }
  return clone;
}

export function normalizeShortcutsWithLegacy(
  configured: FloatingButtonShortcutsConfig,
  grabLegacyKey: string,
  measurerLegacyKey: string,
): FloatingButtonShortcutsConfig {
  const shortcuts: FloatingButtonShortcutsConfig = { ...configured };
  const legacyGrab = tryReadHotkey(grabLegacyKey);
  const legacyMeasurer = tryReadHotkey(measurerLegacyKey);
  if (legacyGrab) shortcuts.grab = [legacyGrab];
  if (legacyMeasurer) shortcuts.measurer = [legacyMeasurer];
  return normalizeShortcuts(shortcuts);
}
