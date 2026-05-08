import type {
  CapturedLog,
  CapturedRequest,
  FloatingButtonConfig,
  FloatingButtonDockEntriesConfig,
  FloatingButtonDockEntryId,
  FloatingButtonDockMode,
  FloatingButtonShortcutCommandId,
  FloatingButtonShortcutsConfig,
  GrabResult,
  LogLevel,
  NetworkStatusClass,
} from "@sakana-y/vue-grab-shared";
import {
  ALL_LOG_LEVELS,
  ALL_NETWORK_STATUS_CLASSES,
  DEFAULT_FLOATING_BUTTON,
  DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
  NETWORK_ERROR_CLASSES,
  NETWORK_WARN_CLASSES,
} from "@sakana-y/vue-grab-shared";
import { buildCombo } from "../hotkeys";
import { openInEditor } from "../editor";
import {
  esc,
  tryReadStorage,
  trySaveStorage,
  A11Y_ICON_SVG,
  scanPageA11y,
  buildLogPrompt,
  buildRequestPrompt,
  formatNetworkStatusLabel,
  resolveLogSource,
  resolveRequestSource,
  truncate,
  toRelativePath,
} from "../utils";
import { openInClaudeCode } from "../editor";

export const FAB_HOST_ID = "vue-grab-fab-host";

const DRAG_THRESHOLD = 3;
const SNAP_TRANSITION = "left 0.3s ease, top 0.3s ease";
const EDGE_MARGIN = 3; // reference margin as % of viewport height
const INITIAL_SNAP_ZONE = 5; // positions within this % of edge get adjusted to responsive margin

type DockEdge = "top" | "bottom" | "left" | "right";
type ToolbarAnchorRect = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;

function edgeMarginX(): number {
  return (EDGE_MARGIN * window.innerHeight) / window.innerWidth;
}

const INITIAL_POSITIONS: Record<FloatingButtonConfig["initialPosition"], { x: number; y: number }> =
  {
    "bottom-right": { x: 97, y: 85 },
    "bottom-left": { x: 3, y: 85 },
    "top-right": { x: 97, y: 15 },
    "top-left": { x: 3, y: 15 },
    "top-center": { x: 50, y: 3 },
  };

const DOCK_MODE_OPTIONS: readonly {
  value: FloatingButtonDockMode;
  label: string;
  title: string;
  icon: string;
}[] = [
  {
    value: "float",
    label: "Float",
    title: "Floating panel",
    icon: `<svg class="dock-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="7" width="14" height="11" rx="2"/><path d="M8 7V5h8v2"/></svg>`,
  },
  {
    value: "edge",
    label: "Edge",
    title: "Docked to edge",
    icon: `<svg class="dock-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 5v14"/></svg>`,
  },
];

function isDockMode(value: string): value is FloatingButtonDockMode {
  return value === "float" || value === "edge";
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function clampCenterForSize(center: number, size: number, viewportSize: number): number {
  if (size >= viewportSize) return viewportSize / 2;
  return clamp(center, size / 2, viewportSize - size / 2);
}

function tryReadPosition(key: string): { x: number; y: number } | null {
  return tryReadStorage(key, (raw) => {
    const { x, y } = JSON.parse(raw);
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  });
}

function trySavePosition(key: string, x: number, y: number): void {
  trySaveStorage(key, JSON.stringify({ x, y }));
}

function tryReadDockMode(key: string): FloatingButtonDockMode | null {
  return tryReadStorage(key, (raw) => (isDockMode(raw) ? raw : "float"));
}

function trySaveDockMode(key: string, dockMode: FloatingButtonDockMode): void {
  trySaveStorage(key, dockMode);
}

function tryReadBoolean(key: string): boolean | null {
  return tryReadStorage(key, (raw) => {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  });
}

function trySaveBoolean(key: string, value: boolean): void {
  trySaveStorage(key, String(value));
}

function tryReadHotkey(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

function tryReadEditor(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

function trySaveEditor(key: string, editor: string): void {
  trySaveStorage(key, editor);
}

const CROSSHAIR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/><line x1="12" y1="15" x2="12" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`;

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

const LOGS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;

const NETWORK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3 9 6-18 3 9h4"/></svg>`;

const MAGNIFIER_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><circle cx="11" cy="11" r="3" stroke-dasharray="2 2"/></svg>`;

const MEASURER_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><line x1="14" y1="14" x2="10" y2="10"/><line x1="7.5" y1="7.5" x2="5.5" y2="9.5"/><line x1="10.5" y1="10.5" x2="8.5" y2="12.5"/><line x1="13.5" y1="13.5" x2="11.5" y2="15.5"/><line x1="16.5" y1="16.5" x2="14.5" y2="18.5"/></svg>`;

const EDITOR_PRESETS = [
  { label: "Auto-detect", value: "" },
  { label: "VS Code", value: "code" },
  { label: "Cursor", value: "cursor" },
];

type TabId = "dock" | "shortcuts" | "tools";
type PanelId = "settings" | "accessibility" | "logs" | "network";
type DockEntryGroupId = "capture" | "inspection" | "diagnostics" | "system";
type DockEntryDropPlacement = "before" | "after";

interface DockEntryDefinition {
  id: FloatingButtonDockEntryId;
  label: string;
  title: string;
  group: DockEntryGroupId;
  buttonClass: string;
  icon: string;
  badge?: string;
  locked?: boolean;
}

interface DockEntryGroupDefinition {
  id: DockEntryGroupId;
  label: string;
}

interface ShortcutCommandDefinition {
  id: FloatingButtonShortcutCommandId;
  label: string;
  description: string;
  icon: string;
  legacyKbdClass?: string;
  legacyRecordClass?: string;
}

const DOCK_ENTRY_GROUPS: readonly DockEntryGroupDefinition[] = [
  { id: "capture", label: "Capture" },
  { id: "inspection", label: "Inspection" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "system", label: "System" },
];

const BETA_BADGE = "Beta";

const DOCK_ENTRY_DEFINITIONS: readonly DockEntryDefinition[] = [
  {
    id: "grab",
    label: "Grab",
    title: "Grab element",
    group: "capture",
    buttonClass: "grab-btn",
    icon: CROSSHAIR_SVG,
  },
  {
    id: "settings",
    label: "Settings",
    title: "Settings",
    group: "system",
    buttonClass: "gear-btn",
    icon: GEAR_SVG,
    locked: true,
  },
  {
    id: "magnifier",
    label: "Magnifier",
    title: "Magnifier loupe",
    group: "inspection",
    buttonClass: "magnifier-btn",
    icon: MAGNIFIER_SVG,
    badge: BETA_BADGE,
  },
  {
    id: "measurer",
    label: "Measurer",
    title: "Measure spacing",
    group: "inspection",
    buttonClass: "measurer-btn",
    icon: MEASURER_SVG,
  },
  {
    id: "accessibility",
    label: "Accessibility",
    title: "Accessibility audit",
    group: "inspection",
    buttonClass: "a11y-btn",
    icon: A11Y_ICON_SVG,
  },
  {
    id: "logs",
    label: "Logs",
    title: "Console logs",
    group: "diagnostics",
    buttonClass: "logs-btn",
    icon: LOGS_SVG,
    badge: BETA_BADGE,
  },
  {
    id: "network",
    label: "Network",
    title: "Network requests",
    group: "diagnostics",
    buttonClass: "network-btn",
    icon: NETWORK_SVG,
    badge: BETA_BADGE,
  },
];

const SHORTCUT_COMMAND_DEFINITIONS: readonly ShortcutCommandDefinition[] = [
  {
    id: "grab",
    label: "Grab element",
    description: "Capture the component under the cursor.",
    icon: CROSSHAIR_SVG,
    legacyKbdClass: "grab-hotkey-kbd",
    legacyRecordClass: "grab-record-btn",
  },
  {
    id: "settings",
    label: "Open settings",
    description: "Toggle the Settings panel.",
    icon: GEAR_SVG,
  },
  {
    id: "magnifier",
    label: "Magnifier",
    description: "Toggle the loupe overlay.",
    icon: MAGNIFIER_SVG,
  },
  {
    id: "measurer",
    label: "Measure spacing",
    description: "Toggle the distance and bounds measurer.",
    icon: MEASURER_SVG,
    legacyKbdClass: "measurer-hotkey-kbd",
    legacyRecordClass: "measurer-record-btn",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Open the accessibility audit panel.",
    icon: A11Y_ICON_SVG,
  },
  {
    id: "logs",
    label: "Logs",
    description: "Open the console logs panel.",
    icon: LOGS_SVG,
  },
  {
    id: "network",
    label: "Network",
    description: "Open the network requests panel.",
    icon: NETWORK_SVG,
  },
];

const DEFAULT_DOCK_ENTRIES_STORAGE_KEY = "vue-grab-dock-entries";
const DEFAULT_SHORTCUTS_STORAGE_KEY = "vue-grab-shortcuts";
const DOCK_ENTRY_IDS = new Set<FloatingButtonDockEntryId>(DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER);
const DOCK_ENTRY_DEFINITION_BY_ID = new Map(
  DOCK_ENTRY_DEFINITIONS.map((entry) => [entry.id, entry]),
);

function isDockEntryId(value: unknown): value is FloatingButtonDockEntryId {
  return typeof value === "string" && DOCK_ENTRY_IDS.has(value as FloatingButtonDockEntryId);
}

function normalizeDockEntries(
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

function tryReadDockEntries(key: string): FloatingButtonDockEntriesConfig | null {
  return tryReadStorage(key, (raw) => normalizeDockEntries(JSON.parse(raw)));
}

function trySaveDockEntries(key: string, entries: FloatingButtonDockEntriesConfig): void {
  trySaveStorage(key, JSON.stringify(entries));
}

function normalizeShortcutCombo(combo: unknown): string | null {
  if (typeof combo !== "string") return null;
  const normalized = combo.trim();
  return normalized ? normalized : null;
}

function normalizeShortcuts(
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

function tryReadShortcuts(key: string): FloatingButtonShortcutsConfig | null {
  return tryReadStorage(key, (raw) => normalizeShortcuts(JSON.parse(raw)));
}

function trySaveShortcuts(key: string, shortcuts: FloatingButtonShortcutsConfig): void {
  trySaveStorage(key, JSON.stringify(shortcuts));
}

const STYLES = `
  :host {
    all: initial;
    --grab-toolbar-active-bg: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
    --grab-control-active-bg: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, rgba(255,255,255,0.04));
    --lvl-log: #9ca3af;
    --lvl-info: #60a5fa;
    --lvl-warn: #f59e0b;
    --lvl-error: #ef4444;
    --lvl-debug: #a78bfa;
  }

  /* ── FAB wrapper (flex column: bar + panel) ── */
  .fab-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .fab-wrapper.expand-up {
    flex-direction: column-reverse;
  }
  .fab-wrapper.expand-right {
    flex-direction: row;
    align-items: center;
  }
  .fab-wrapper.expand-left {
    flex-direction: row-reverse;
    align-items: center;
  }
  .fab-wrapper.edge {
    gap: 0;
    align-items: stretch;
  }
  .fab-wrapper.edge.edge-left,
  .fab-wrapper.edge.edge-right {
    height: 100vh;
    flex-direction: row;
  }
  .fab-wrapper.edge.edge-right {
    flex-direction: row-reverse;
  }
  .fab-wrapper.edge.edge-top,
  .fab-wrapper.edge.edge-bottom {
    width: 100vw;
    flex-direction: column;
  }
  .fab-wrapper.edge.edge-bottom {
    flex-direction: column-reverse;
  }
  /* ── Toolbar (compact bar) ── */
  .toolbar {
    display: inline-flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    cursor: grab;
    user-select: none;
    touch-action: none;
    position: relative;
  }
  .fab-wrapper.edge .toolbar {
    border-radius: 0;
  }
  .fab-wrapper.edge.edge-left .toolbar,
  .fab-wrapper.edge.edge-right .toolbar {
    width: 36px;
    height: 100vh;
    justify-content: center;
  }
  .fab-wrapper.edge.edge-top .toolbar,
  .fab-wrapper.edge.edge-bottom .toolbar {
    width: 100vw;
    height: 36px;
    align-items: center;
  }
  .toolbar.dragging {
    cursor: grabbing;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }

  /* ── Button row ── */
  .toolbar-row {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 4px;
    gap: 2px;
    flex-shrink: 0;
  }

  .toolbar-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #a0a0a0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .toolbar-btn:hover {
    color: #e0e0e0;
    background: rgba(255,255,255,0.08);
  }
  .grab-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: var(--grab-toolbar-active-bg);
  }
  .gear-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: var(--grab-toolbar-active-bg);
  }
  .toolbar-divider {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.12);
    margin: 0 2px;
  }
  .a11y-btn.active {
    color: #4ade80;
    box-shadow: inset 0 0 0 1.5px #4ade80;
    background: rgba(74, 222, 128, 0.12);
  }
  .logs-btn {
    position: relative;
  }
  .logs-btn.active {
    color: #f59e0b;
    box-shadow: inset 0 0 0 1.5px #f59e0b;
    background: rgba(245, 158, 11, 0.12);
  }
  .magnifier-btn.active {
    color: #c084fc;
    box-shadow: inset 0 0 0 1.5px #c084fc;
    background: rgba(192, 132, 252, 0.12);
  }
  .magnifier-btn.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .measurer-btn.active {
    color: #06b6d4;
    box-shadow: inset 0 0 0 1.5px #06b6d4;
    background: rgba(6, 182, 212, 0.12);
  }
  .logs-badge {
    position: absolute;
    top: 1px;
    right: 1px;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--lvl-warn);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    padding: 0 3px;
    pointer-events: none;
  }
  .logs-badge.has-error {
    background: var(--lvl-error);
  }

  /* ── A11y panel ── */
  .a11y-panel { padding: 14px; }
  .a11y-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .a11y-title {
    font-size: 13px;
    font-weight: 650;
    color: #e8e8e8;
  }
  .a11y-rescan-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .a11y-rescan-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .a11y-summary-strip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 16px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
    color: #888;
    font-size: 12px;
    line-height: 1.35;
  }
  .a11y-summary-count {
    color: #e8e8e8;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .a11y-summary-count.pass { color: #4ade80; }
  .a11y-summary-count.fail { color: #ffcb6b; }
  .a11y-summary-count.neutral { color: #aaa; }
  .a11y-summary-separator {
    color: #555;
    padding: 0 2px;
  }
  .a11y-audit-list {
    margin-bottom: 16px;
  }
  .a11y-group-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .a11y-group-count,
  .a11y-row-count,
  .a11y-status-chip {
    font-size: 10px;
    line-height: 1.2;
    border-radius: 10px;
    padding: 2px 7px;
    background: rgba(255,255,255,0.08);
    color: #aaa;
    font-variant-numeric: tabular-nums;
  }
  .a11y-row {
    transition: background 0.12s ease;
    cursor: default;
  }
  .a11y-row:hover {
    background: rgba(255,255,255,0.04);
  }
  .a11y-row-icon.pass { color: #4ade80; }
  .a11y-row-icon.fail { color: #ffcb6b; }
  .a11y-row-icon.neutral { color: #6b6b6b; }
  .a11y-row-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #7dd3fc;
  }
  .a11y-row-file {
    word-break: break-all;
  }
  .a11y-row-detail {
    display: block;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #999;
  }
  .a11y-row-detail.warning { color: #ffcb6b; }
  .a11y-row-control {
    align-self: stretch;
  }
  .a11y-row-toggle {
    cursor: pointer;
  }
  .a11y-row-toggle .a11y-row {
    cursor: pointer;
  }
  .a11y-row-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-right: 4px;
    color: #666;
    font-size: 10px;
    transition: transform 0.15s ease;
  }
  .a11y-row-chevron.open {
    transform: rotate(90deg);
  }
  .a11y-row-count {
    background: rgba(255,203,107,0.14);
    color: #ffcb6b;
  }
  .a11y-status-chip.pass {
    background: rgba(74,222,128,0.12);
    color: #4ade80;
  }
  .a11y-status-chip.fail {
    background: rgba(255,203,107,0.14);
    color: #ffcb6b;
  }
  .a11y-status-chip.neutral {
    background: rgba(255,255,255,0.06);
    color: #8a8a8a;
  }
  .a11y-child-details {
    display: none;
    padding: 0 12px 12px 56px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .a11y-child-details.open {
    display: block;
  }
  .a11y-audit-list > .a11y-row-toggle {
    display: contents;
  }
  .a11y-audit-list > .a11y-row-toggle:last-child .a11y-row,
  .a11y-audit-list > .a11y-row-toggle:last-child .a11y-child-details {
    border-bottom: 0;
  }
  .a11y-child-surface {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 6px;
    background: rgba(0,0,0,0.18);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  }
  .a11y-child-row {
    font-size: 11px;
    padding: 5px 7px;
    border-radius: 5px;
    background: rgba(255,255,255,0.025);
  }
  .a11y-child-tag {
    color: #c792ea;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
  }
  .a11y-child-msg {
    font-size: 11px;
    line-height: 1.35;
    margin-top: 2px;
  }
  .a11y-child-msg.warning { color: #ffcb6b; }
  .a11y-child-msg.pass { color: #4ade80; }
  .a11y-child-msg.neutral { color: #666; font-style: italic; }
  .a11y-empty {
    color: #777;
    text-align: center;
    padding: 24px;
    font-size: 12px;
  }
  .a11y-rescan-btn--loading {
    opacity: 0.6;
    pointer-events: none;
  }
  @media (max-width: 520px) {
    .a11y-row-control {
      grid-column: 2;
      justify-content: flex-start;
    }
    .a11y-child-details {
      padding-left: 42px;
    }
  }

  /* ── Expand body (separate card below/above bar) ── */
  .expand-body {
    display: none;
    flex-direction: column;
    overflow-y: auto;
    height: min(500px, 65vh);
    width: min(900px, 85vw);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    cursor: default;
    touch-action: pan-y;
    user-select: text;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    box-sizing: border-box;
  }
  .expand-body.open {
    display: flex;
  }
  .fab-wrapper.edge .expand-body {
    border-radius: 0;
    margin: 0;
    box-shadow: 0 0 24px rgba(0,0,0,0.4);
  }
  .fab-wrapper.edge.edge-left .expand-body,
  .fab-wrapper.edge.edge-right .expand-body {
    width: min(900px, calc(100vw - 36px));
    height: 100vh;
    max-height: 100vh;
  }
  .fab-wrapper.edge.edge-top .expand-body,
  .fab-wrapper.edge.edge-bottom .expand-body {
    width: 100vw;
    height: min(520px, calc(100vh - 36px));
    max-height: calc(100vh - 36px);
  }
  .expand-body::-webkit-scrollbar {
    width: 6px;
  }
  .expand-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .expand-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  /* ── Tabs (inside settings content) ── */
  .tab-bar {
    display: flex;
    padding: 0 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    gap: 0;
    flex-shrink: 0;
    overflow-x: auto;
  }
  .tab-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 12px;
    font-family: inherit;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }
  .tab-btn:hover {
    color: #ccc;
  }
  .tab-btn.active {
    color: var(--grab-color, #4f46e5);
    border-bottom-color: var(--grab-color, #4f46e5);
  }
  .tab-content {
    padding: 14px;
    display: none;
  }
  .tab-content.active {
    display: block;
  }

  /* Dock controls */
  .setting-help {
    color: #888;
    font-size: 12px;
    line-height: 1.35;
    margin: -4px 0 10px;
  }
  .dock-mode-group {
    display: inline-flex;
    max-width: 100%;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.07);
    box-sizing: border-box;
  }
  .dock-mode-option {
    min-width: 76px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #999;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .dock-mode-option:hover {
    color: #ddd;
    background: rgba(255,255,255,0.07);
  }
  .dock-mode-option.active {
    color: var(--grab-color, #4f46e5);
    background: rgba(0,0,0,0.32);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }
  .dock-mode-icon {
    flex: 0 0 auto;
  }
  .dock-settings-list {
    margin-bottom: 16px;
  }
  .dock-mode-row .setting-row-control {
    min-width: 174px;
  }
  .setting-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
  }
  .setting-toggle-row {
    cursor: pointer;
  }
  .setting-toggle-copy {
    min-width: 0;
  }
  .setting-toggle-title {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }
  .setting-toggle-description {
    color: #888;
    font-size: 12px;
    line-height: 1.35;
    margin-top: 2px;
  }
  .setting-toggle-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .setting-toggle-switch {
    position: relative;
    flex: 0 0 auto;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: rgba(255,255,255,0.14);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
    transition: background 0.15s ease, box-shadow 0.15s ease;
  }
  .setting-toggle-switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    transition: transform 0.15s ease;
  }
  .setting-toggle-input:checked + .setting-toggle-switch {
    background: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  }
  .setting-toggle-input:checked + .setting-toggle-switch::after {
    transform: translateX(16px);
  }
  .setting-toggle-input:focus-visible + .setting-toggle-switch {
    box-shadow: 0 0 0 2px var(--grab-color, #4f46e5);
  }
  .dock-entry-manager {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .dock-entry-group {
    overflow: visible;
  }
  .dock-entry-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .dock-entry-group-title {
    color: #888;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .dock-entry-group-count {
    color: #888;
    font-size: 12px;
    margin-left: 4px;
  }
  .dock-entry-group-toggle {
    margin-left: auto;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--grab-color, #4f46e5);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-group-toggle:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
  }
  .dock-entry-group-toggle.is-partial {
    color: #bbb;
    background: rgba(255,255,255,0.09);
  }
  .dock-entry-group-toggle:disabled {
    color: #777;
    background: rgba(255,255,255,0.06);
    cursor: not-allowed;
  }
  .dock-entry-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(210px, auto);
    align-items: center;
    position: relative;
  }
  .dock-entry-row.is-dragging {
    opacity: 0.45;
  }
  .dock-entry-row.is-drop-before::before,
  .dock-entry-row.is-drop-after::after {
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
    height: 2px;
    border-radius: 999px;
    background: var(--grab-color, #4f46e5);
    box-shadow: 0 0 8px color-mix(in srgb, var(--grab-color, #4f46e5) 45%, transparent);
  }
  .dock-entry-row.is-drop-before::before {
    top: 0;
  }
  .dock-entry-row.is-drop-after::after {
    bottom: 0;
  }
  .dock-entry-drag {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: #666;
    font-size: 18px;
    line-height: 1;
    cursor: grab;
    user-select: none;
  }
  .dock-entry-drag:hover {
    color: #bbb;
    background: rgba(255,255,255,0.08);
  }
  .dock-entry-drag:active {
    cursor: grabbing;
  }
  .dock-entry-check {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--grab-color, #4f46e5);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    line-height: 1;
  }
  .dock-entry-check:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
  }
  .dock-entry-check.is-hidden {
    color: #777;
    background: rgba(255,255,255,0.05);
  }
  .dock-entry-check:disabled {
    color: #777;
    background: rgba(255,255,255,0.05);
    cursor: not-allowed;
  }
  .dock-entry-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9a9a9a;
  }
  .dock-entry-icon svg {
    width: 18px;
    height: 18px;
  }
  .dock-entry-label {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dock-entry-label-text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dock-entry-badge {
    flex: 0 0 auto;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(251,191,36,0.14);
    color: #fbbf24;
    box-shadow: inset 0 0 0 1px rgba(251,191,36,0.28);
    font-size: 9px;
    font-weight: 700;
    line-height: 1.35;
    text-transform: uppercase;
  }
  .dock-entry-move {
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
    color: #aaa;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-move:hover {
    background: rgba(255,255,255,0.13);
    color: #fff;
  }
  .dock-entry-move:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .dock-entry-lock {
    color: #888;
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
  }

  /* Section label */
  .section-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-label:not(:first-child) {
    margin-top: 14px;
  }

  /* Settings command rows */
  .settings-list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
  }
  .settings-list + .section-label {
    margin-top: 16px;
  }
  .setting-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(170px, auto);
    align-items: center;
    gap: 14px;
    min-height: 58px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    box-sizing: border-box;
  }
  .setting-row:last-child {
    border-bottom: 0;
  }
  .setting-row-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9a9a9a;
  }
  .setting-row-icon svg {
    width: 18px;
    height: 18px;
  }
  .setting-row-copy {
    min-width: 0;
  }
  .setting-row-title {
    display: block;
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .setting-row-description {
    display: block;
    color: #7d7d7d;
    font-size: 12px;
    line-height: 1.35;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .setting-row-control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }
  .dock-entry-controls {
    gap: 6px;
    flex-wrap: nowrap;
  }
  .setting-row-control.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .shortcut-controls {
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .shortcut-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 26px;
    padding: 0 4px 0 9px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    background: rgba(0,0,0,0.32);
    color: #ddd;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .shortcut-remove-btn {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #888;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    line-height: 1;
  }
  .shortcut-remove-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  .shortcut-recording-chip {
    animation: pulse 1.5s ease-in-out infinite;
    border-color: var(--grab-color, #4f46e5);
    box-shadow: 0 0 0 1px var(--grab-color, #4f46e5);
  }
  .shortcut-empty {
    color: #777;
    font-size: 12px;
  }
  .shortcut-error {
    width: 100%;
    color: #ff8a8a;
    font-size: 11px;
    text-align: right;
  }
  .hotkey-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  kbd {
    display: inline-flex;
    align-items: center;
    background: rgba(0,0,0,0.32);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #ddd;
    min-width: 80px;
    justify-content: center;
    flex: 1;
  }
  kbd.recording {
    border-color: var(--grab-color, #4f46e5);
    box-shadow: 0 0 0 1px var(--grab-color, #4f46e5);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .record-btn {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #ccc;
    padding: 5px 11px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }
  .record-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }

  /* Select dropdown */
  .editor-select {
    width: 100%;
    min-width: 180px;
    padding: 7px 30px 7px 10px;
    background-color: rgba(0,0,0,0.32);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #ddd;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  .editor-select:focus {
    outline: none;
    border-color: var(--grab-color, #4f46e5);
  }
  .editor-select option {
    background: #1e1e1e;
    color: #ddd;
  }

  /* Open file button */
  .open-file-btn {
    padding: 7px 12px;
    background: var(--grab-color, #4f46e5);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .open-file-btn:hover {
    opacity: 0.85;
  }
  .open-file-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .file-path-display {
    font-size: 11px;
    color: #777;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    line-height: 1.35;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .slider-row input[type="range"] {
    flex: 1;
    min-width: 140px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  .slider-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--grab-color, #4f46e5);
    cursor: pointer;
  }
  .slider-value {
    font-size: 11px;
    color: #aaa;
    min-width: 42px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 520px) {
    .setting-row {
      grid-template-columns: 28px minmax(0, 1fr);
    }
    .setting-row-control {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .setting-row-description {
      white-space: normal;
    }
  }

  /* Vertical layout */
  .toolbar.vertical .toolbar-row {
    flex-direction: column;
    height: auto;
    width: 36px;
    padding: 4px 0;
  }
  .toolbar.vertical .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }
  /* When expanded vertically + vertical toolbar, override to horizontal row */
  .fab-wrapper.expanded:not(.edge):not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.expanded:not(.edge):not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  /* Dock toolbar layout */
  .fab-wrapper.edge.edge-left .toolbar .toolbar-row,
  .fab-wrapper.edge.edge-right .toolbar .toolbar-row {
    flex-direction: column;
    height: auto;
    width: 36px;
    padding: 4px 0;
  }
  .fab-wrapper.edge.edge-left .toolbar .toolbar-divider,
  .fab-wrapper.edge.edge-right .toolbar .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }
  .fab-wrapper.edge.edge-top .toolbar .toolbar-row,
  .fab-wrapper.edge.edge-bottom .toolbar .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.edge.edge-top .toolbar .toolbar-divider,
  .fab-wrapper.edge.edge-bottom .toolbar .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  /* ── Console (logs) panel ── */
  .logs-panel {
    padding: 14px;
    min-width: min(420px, 100%);
    box-sizing: border-box;
  }
  .logs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .logs-title {
    font-size: 13px;
    font-weight: 600;
    color: #e0e0e0;
  }
  .logs-clear-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .logs-clear-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .logs-panel .logs-header {
    margin-bottom: 14px;
    gap: 14px;
  }
  .logs-panel-heading {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .logs-panel .logs-title {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
  }
  .logs-panel-meta {
    color: #7d7d7d;
    font-size: 12px;
    line-height: 1.3;
  }
  .logs-panel .logs-clear-btn {
    flex: 0 0 auto;
    padding: 5px 11px;
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.07);
    color: #ccc;
  }
  .logs-panel .logs-clear-btn:hover {
    background: rgba(255,255,255,0.13);
    color: #fff;
  }
  .logs-section-label {
    margin-bottom: 8px;
  }
  .logs-filter-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .logs-panel .logs-filter-bar {
    gap: 6px;
    margin-bottom: 12px;
  }
  .logs-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.04);
    color: #888;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .logs-pill[data-level="log"]   { --c: var(--lvl-log); }
  .logs-pill[data-level="info"]  { --c: var(--lvl-info); }
  .logs-pill[data-level="warn"]  { --c: var(--lvl-warn); }
  .logs-pill[data-level="error"] { --c: var(--lvl-error); }
  .logs-pill[data-level="debug"] { --c: var(--lvl-debug); }
  .logs-pill.active {
    background: color-mix(in srgb, var(--c) 15%, transparent);
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 40%, transparent);
  }
  .logs-pill .count {
    opacity: 0.8;
    font-weight: 500;
  }
  .logs-panel .logs-pill {
    min-height: 26px;
    padding: 0 8px;
    border-radius: 6px;
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
    color: #999;
    letter-spacing: 0.02em;
  }
  .logs-panel .logs-pill:hover {
    background: rgba(255,255,255,0.1);
    color: #ddd;
  }
  .logs-panel .logs-pill.active {
    background: color-mix(in srgb, var(--c) 14%, rgba(0,0,0,0.28));
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 32%, rgba(255,255,255,0.08));
  }
  .logs-panel .logs-pill .count {
    color: #d0d0d0;
    font-variant-numeric: tabular-nums;
  }
  .logs-search-row {
    margin-bottom: 14px;
  }
  .logs-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: #e0e0e0;
    padding: 5px 8px;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  .logs-search:focus {
    border-color: rgba(99,102,241,0.5);
  }
  .logs-panel .logs-search {
    margin-bottom: 0;
    padding: 7px 10px;
    border-color: rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.28);
    border-radius: 6px;
  }
  .logs-panel .logs-search:focus {
    border-color: var(--grab-color, #4f46e5);
  }
  .logs-list {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
  }
  .log-row {
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 4px;
    border-left: 3px solid var(--c, #666);
    background: color-mix(in srgb, var(--c, #666) 5%, transparent);
    transition: background 0.1s ease;
  }
  .log-row:hover {
    background: color-mix(in srgb, var(--c, #666) 10%, transparent);
  }
  .log-row[data-level="log"]   { --c: var(--lvl-log); }
  .log-row[data-level="info"]  { --c: var(--lvl-info); }
  .log-row[data-level="warn"]  { --c: var(--lvl-warn); }
  .log-row[data-level="error"] { --c: var(--lvl-error); }
  .log-row[data-level="debug"] { --c: var(--lvl-debug); }
  .logs-panel .log-row {
    position: relative;
    padding: 0;
    margin-bottom: 0;
    border-left: 0;
    border-radius: 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: transparent;
  }
  .logs-panel .log-row:last-child {
    border-bottom: 0;
  }
  .logs-panel .log-row::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--c, #666);
    opacity: 0.9;
  }
  .logs-panel .log-row:hover {
    background: color-mix(in srgb, var(--c, #666) 7%, transparent);
  }
  .log-row-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .logs-panel .log-row-header {
    width: 100%;
    min-height: 44px;
    padding: 9px 12px 9px 14px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }
  .logs-panel .log-row-header:focus-visible {
    outline: 2px solid var(--grab-color, #4f46e5);
    outline-offset: -2px;
  }
  .log-row-level {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 18%, transparent);
    color: var(--c);
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 600;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .logs-panel .log-row-level {
    min-width: 40px;
    padding: 2px 6px;
    border-radius: 5px;
    text-align: center;
    box-sizing: border-box;
  }
  .log-row-source {
    font-size: 9px;
    color: #888;
    padding: 1px 4px;
    border-radius: 3px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    text-transform: lowercase;
  }
  .logs-panel .log-row-source {
    min-width: 44px;
    padding: 2px 6px;
    border-radius: 5px;
    color: #aaa;
    background: rgba(255,255,255,0.06);
    text-align: center;
  }
  .log-row-msg {
    font-size: 12px;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .logs-panel .log-row-msg {
    color: #e6e6e6;
    line-height: 1.35;
  }
  .log-row-count {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: var(--c);
    border-radius: 8px;
    padding: 0 5px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .logs-panel .log-row-count {
    border-radius: 999px;
    padding: 1px 6px;
    font-variant-numeric: tabular-nums;
  }
  .log-row-time {
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .logs-panel .log-row-time {
    min-width: 74px;
    color: #777;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .log-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .logs-panel .log-row-chevron {
    width: 12px;
    color: #777;
  }
  .log-row-chevron.open {
    transform: rotate(90deg);
  }
  .log-row-details {
    display: none;
    margin-top: 8px;
  }
  .log-row-details.open {
    display: block;
  }
  .logs-panel .log-row-details {
    margin: 0;
    padding: 0 12px 10px 29px;
  }
  .logs-panel .log-row-details.open {
    display: block;
  }
  .log-row-detail-surface {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.24);
  }
  .log-row-stack {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #999;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    padding: 6px 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .logs-panel .log-row-stack {
    max-height: 170px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.28);
  }
  .log-row-vue-info {
    font-size: 11px;
    color: #c792ea;
    margin-bottom: 6px;
  }
  .logs-panel .log-row-vue-info {
    color: #d8b4fe;
    line-height: 1.35;
  }
  .log-row-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .log-action-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .log-action-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .log-action-btn.primary {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }
  .log-action-btn.primary:hover {
    background: rgba(99, 102, 241, 0.25);
    color: #c7d2fe;
  }
  .logs-panel .log-action-btn {
    padding: 5px 10px;
  }
  .logs-panel .log-row-actions {
    flex-wrap: wrap;
  }
  .logs-empty {
    color: #555;
    text-align: center;
    padding: 20px;
    font-size: 12px;
  }
  .logs-panel .logs-empty {
    color: #777;
    padding: 24px 14px;
    background: rgba(12,12,12,0.36);
  }
  .logs-panel .logs-empty-compact {
    margin-top: 2px;
    padding: 9px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #888;
    font-size: 12px;
    line-height: 1.35;
  }

  /* ── Network panel ── */
  .network-btn {
    position: relative;
  }
  .network-btn.active {
    color: #60a5fa;
    box-shadow: inset 0 0 0 1.5px #60a5fa;
    background: rgba(96,165,250,0.12);
  }
  .network-badge {
    position: absolute;
    top: 1px;
    right: 1px;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--lvl-warn);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    padding: 0 3px;
    pointer-events: none;
  }
  .network-badge.has-error {
    background: var(--lvl-error);
  }
  .network-panel { padding: 12px 14px; min-width: 380px; }
  .net-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.04);
    color: #888;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .net-pill[data-status="2xx"]    { --c: var(--lvl-log); }
  .net-pill[data-status="3xx"]    { --c: var(--lvl-info); }
  .net-pill[data-status="4xx"]    { --c: var(--lvl-warn); }
  .net-pill[data-status="5xx"]    { --c: var(--lvl-error); }
  .net-pill[data-status="failed"] { --c: var(--lvl-error); }
  .net-pill.active {
    background: color-mix(in srgb, var(--c) 15%, transparent);
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 40%, transparent);
  }
  .net-pill .count {
    opacity: 0.8;
    font-weight: 500;
  }
  .net-row {
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 4px;
    border-left: 3px solid var(--c, #666);
    background: color-mix(in srgb, var(--c, #666) 5%, transparent);
    transition: background 0.1s ease;
  }
  .net-row:hover {
    background: color-mix(in srgb, var(--c, #666) 10%, transparent);
  }
  .net-row[data-status="2xx"]    { --c: var(--lvl-log); }
  .net-row[data-status="3xx"]    { --c: var(--lvl-info); }
  .net-row[data-status="4xx"]    { --c: var(--lvl-warn); }
  .net-row[data-status="5xx"]    { --c: var(--lvl-error); }
  .net-row[data-status="failed"] { --c: var(--lvl-error); }
  .net-row-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .net-row-method {
    font-size: 10px;
    background: rgba(255,255,255,0.1);
    color: #ddd;
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 600;
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .net-row-status {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 18%, transparent);
    color: var(--c);
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 600;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .net-row-url {
    font-size: 12px;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    direction: rtl;
    text-align: left;
  }
  .net-row-duration {
    font-size: 10px;
    color: #888;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .net-row-count {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: var(--c);
    border-radius: 8px;
    padding: 0 5px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .net-row-time {
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .net-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .net-row-chevron.open {
    transform: rotate(90deg);
  }
  .net-row-details {
    display: none;
    margin-top: 8px;
  }
  .net-row-details.open {
    display: block;
  }
  .net-section-title {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 8px 0 4px;
  }
  .net-kv {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #bbb;
    padding: 1px 0;
    word-break: break-all;
  }
  .net-kv .k { color: #7dd3fc; }
  .net-body {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #ddd;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
    padding: 6px 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
  }
  .net-row-error {
    font-size: 11px;
    color: var(--lvl-error);
    margin-bottom: 6px;
  }
`;

export class FloatingButton {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private wrapperEl: HTMLElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private toolbarRowEl: HTMLElement | null = null;
  private expandBodyEl: HTMLElement | null = null;
  private btnEl: HTMLElement | null = null;
  private gearEl: HTMLElement | null = null;
  private a11yIndicatorEl: HTMLElement | null = null;
  private logsBtnEl: HTMLElement | null = null;
  private logsBadgeEl: HTMLElement | null = null;
  private networkBtnEl: HTMLElement | null = null;
  private networkBadgeEl: HTMLElement | null = null;
  private magnifierBtnEl: HTMLElement | null = null;
  private measurerBtnEl: HTMLElement | null = null;
  private logEntries: CapturedLog[] = [];
  private filterLevels: Set<LogLevel> = new Set<LogLevel>(ALL_LOG_LEVELS);
  private searchTerm = "";
  private searchDebounceId: number | null = null;
  private networkEntries: CapturedRequest[] = [];
  private networkFilterStatus: Set<NetworkStatusClass> = new Set<NetworkStatusClass>(
    ALL_NETWORK_STATUS_CLASSES,
  );
  private networkSearchTerm = "";
  private networkSearchDebounceId: number | null = null;
  private networkRenderRafId: number | null = null;
  private lastNetworkBadge: { count: number; hasError: boolean } | null = null;
  private dockEntries: FloatingButtonDockEntriesConfig;
  private dockEntriesStorageKey: string;
  private shortcuts: FloatingButtonShortcutsConfig;
  private shortcutsStorageKey: string;
  private dockEntryDragId: FloatingButtonDockEntryId | null = null;
  private dockEntryDropTargetEl: HTMLElement | null = null;
  private cachedA11yResults: ReturnType<typeof scanPageA11y> | null = null;
  private lastA11yScanTime = 0;
  private pendingRafId: number | null = null;
  private logsRenderRafId: number | null = null;
  private preservedToolbarRect: ToolbarAnchorRect | null = null;
  private config: FloatingButtonConfig;

  // Expand state
  private activePanel: PanelId | null = null;
  private settingsTab: TabId = "dock";
  private isGrabActive = false;
  private isMagnifierActive = false;
  private isMeasurerActive = false;
  private dockMode: FloatingButtonDockMode;
  private closeOnOutsideClick: boolean;

  // Editor state
  private editorChoice = "";
  private lastGrabResult: GrabResult | null = null;

  // Position (viewport %)
  private posX = 97;
  private posY = 85;

  // Drag state (toolbar)
  private isDragging = false;
  private wasDragged = false;
  private dragPointerId = -1;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private lastAppliedEdge: DockEdge | null = null;

  // Shortcut state
  private recordingShortcutId: FloatingButtonShortcutCommandId | null = null;
  private shortcutError: { id: FloatingButtonShortcutCommandId; message: string } | null = null;

  // Callbacks
  private toggleCb: (() => void) | null = null;
  private shortcutsChangeCb: ((shortcuts: FloatingButtonShortcutsConfig) => void) | null = null;
  private hotkeyChangeCb: ((combo: string) => void) | null = null;
  private logsClearCb: (() => void) | null = null;
  private networkClearCb: (() => void) | null = null;
  private magnifierToggleCb: (() => void) | null = null;
  private measurerToggleCb: (() => void) | null = null;
  private measurerHotkeyChangeCb: ((combo: string) => void) | null = null;
  private magnifierConfigChangeCb:
    | ((config: { loupeSize?: number; zoomLevel?: number }) => void)
    | null = null;
  private magnifierLoupeSize = 400;
  private magnifierZoomLevel = 3;

  // Bound handlers for cleanup
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private boundDocClick: ((e: MouseEvent) => void) | null = null;
  private boundDocKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundRecordKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: FloatingButtonConfig) {
    this.config = config;
    const initial = INITIAL_POSITIONS[config.initialPosition] ?? INITIAL_POSITIONS["bottom-right"];
    const saved = tryReadPosition(config.storageKey);
    if (saved) {
      this.posX = saved.x;
      this.posY = saved.y;
    } else {
      this.posX = initial.x;
      this.posY = initial.y;
      if (this.posX <= INITIAL_SNAP_ZONE) this.posX = edgeMarginX();
      else if (this.posX >= 100 - INITIAL_SNAP_ZONE) this.posX = 100 - edgeMarginX();
    }
    this.editorChoice = tryReadEditor(config.editorStorageKey) ?? "";
    const configuredDockMode = isDockMode(config.dockMode) ? config.dockMode : "float";
    this.dockMode = tryReadDockMode(config.dockModeStorageKey) ?? configuredDockMode;
    this.dockEntriesStorageKey = config.dockEntriesStorageKey ?? DEFAULT_DOCK_ENTRIES_STORAGE_KEY;
    this.dockEntries =
      tryReadDockEntries(this.dockEntriesStorageKey) ?? normalizeDockEntries(config.dockEntries);
    this.shortcutsStorageKey = config.shortcutsStorageKey ?? DEFAULT_SHORTCUTS_STORAGE_KEY;
    const storedShortcuts = tryReadShortcuts(this.shortcutsStorageKey);
    this.shortcuts =
      storedShortcuts ??
      this.normalizeShortcutsWithLegacy(
        { ...DEFAULT_FLOATING_BUTTON.shortcuts, ...config.shortcuts },
        config.hotkeyStorageKey,
        config.measurerHotkeyStorageKey,
      );
    this.closeOnOutsideClick =
      tryReadBoolean(config.closeOnOutsideClickStorageKey) ?? config.closeOnOutsideClick;
  }

  getCurrentHotkey(): string {
    return this.getShortcutCombos("grab")[0] ?? "";
  }

  getShortcuts(): FloatingButtonShortcutsConfig {
    return this.cloneShortcuts(this.shortcuts);
  }

  getEditorChoice(): string {
    return this.editorChoice;
  }

  setLastResult(result: GrabResult | null): void {
    this.lastGrabResult = result;

    if (this.activePanel === "settings") {
      this.updateEditorTabInPlace();
    } else if (this.activePanel === "accessibility") {
      this.renderExpandBody();
    }
  }

  private createDockEntryButton(id: FloatingButtonDockEntryId): HTMLElement {
    const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id)!;
    const el = document.createElement("div");
    el.className = `toolbar-btn ${def.buttonClass}`;
    el.dataset.dockEntry = id;
    el.innerHTML = def.icon;
    el.title = def.title;
    return el;
  }

  private getDockEntryElement(id: FloatingButtonDockEntryId): HTMLElement | null {
    if (id === "grab") return this.btnEl;
    if (id === "settings") return this.gearEl;
    if (id === "magnifier") return this.magnifierBtnEl;
    if (id === "measurer") return this.measurerBtnEl;
    if (id === "accessibility") return this.a11yIndicatorEl;
    if (id === "logs") return this.logsBtnEl;
    if (id === "network") return this.networkBtnEl;
    return null;
  }

  private visibleDockEntryIds(): FloatingButtonDockEntryId[] {
    const hidden = new Set(this.dockEntries.hidden);
    hidden.delete("settings");
    return this.dockEntries.order.filter((id) => id === "settings" || !hidden.has(id));
  }

  private renderToolbarEntries(): void {
    if (!this.toolbarRowEl) return;
    this.toolbarRowEl.replaceChildren();

    let previousGroup: DockEntryGroupId | null = null;
    for (const id of this.visibleDockEntryIds()) {
      const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
      const el = this.getDockEntryElement(id);
      if (!def || !el) continue;
      if (previousGroup && previousGroup !== def.group) {
        const divider = document.createElement("div");
        divider.className = "toolbar-divider";
        this.toolbarRowEl.appendChild(divider);
      }
      this.toolbarRowEl.appendChild(el);
      previousGroup = def.group;
    }
  }

  private cloneShortcuts(shortcuts: FloatingButtonShortcutsConfig): FloatingButtonShortcutsConfig {
    const clone: FloatingButtonShortcutsConfig = {};
    for (const id of DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER) {
      const combos = shortcuts[id];
      if (combos?.length) clone[id] = [...combos];
    }
    return clone;
  }

  private normalizeShortcutsWithLegacy(
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

  private getShortcutCombos(id: FloatingButtonShortcutCommandId): string[] {
    return [...(this.shortcuts[id] ?? [])];
  }

  private hasShortcutCombo(combo: string, except?: FloatingButtonShortcutCommandId): boolean {
    const needle = combo.toLowerCase();
    return DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER.some(
      (id) =>
        id !== except && (this.shortcuts[id] ?? []).some((value) => value.toLowerCase() === needle),
    );
  }

  private persistShortcuts(): void {
    trySaveShortcuts(this.shortcutsStorageKey, this.shortcuts);
  }

  private commitShortcuts(
    shortcuts: FloatingButtonShortcutsConfig,
    persist: boolean,
    emit = true,
  ): void {
    const previousGrab = this.shortcuts.grab?.[0] ?? "";
    const previousMeasurer = this.shortcuts.measurer?.[0] ?? "";
    this.shortcuts = normalizeShortcuts(shortcuts);
    if (persist) this.persistShortcuts();
    if (this.activePanel === "settings" && this.settingsTab === "shortcuts") {
      this.renderExpandBody();
    }
    if (!emit) return;
    const snapshot = this.cloneShortcuts(this.shortcuts);
    this.shortcutsChangeCb?.(snapshot);
    const nextGrab = snapshot.grab?.[0] ?? "";
    const nextMeasurer = snapshot.measurer?.[0] ?? "";
    if (nextGrab !== previousGrab) this.hotkeyChangeCb?.(nextGrab);
    if (nextMeasurer !== previousMeasurer) this.measurerHotkeyChangeCb?.(nextMeasurer);
  }

  private setFirstShortcut(
    id: FloatingButtonShortcutCommandId,
    combo: string,
    persist: boolean,
  ): void {
    const next = this.cloneShortcuts(this.shortcuts);
    const current = next[id] ?? [];
    const normalized = normalizeShortcutCombo(combo);
    if (normalized)
      next[id] = [
        normalized,
        ...current.filter((value) => value.toLowerCase() !== normalized.toLowerCase()).slice(1),
      ];
    else delete next[id];
    this.commitShortcuts(next, persist, false);
  }

  private addShortcut(id: FloatingButtonShortcutCommandId, combo: string): boolean {
    const normalized = normalizeShortcutCombo(combo);
    if (!normalized) return false;
    if (this.hasShortcutCombo(normalized, id)) {
      this.shortcutError = { id, message: "Already used by another feature" };
      this.renderExpandBody();
      return false;
    }
    const next = this.cloneShortcuts(this.shortcuts);
    const existing = next[id] ?? [];
    if (!existing.some((value) => value.toLowerCase() === normalized.toLowerCase())) {
      next[id] = [...existing, normalized];
    }
    this.shortcutError = null;
    this.commitShortcuts(next, true);
    return true;
  }

  private removeShortcut(id: FloatingButtonShortcutCommandId, combo: string): void {
    const next = this.cloneShortcuts(this.shortcuts);
    const remaining = (next[id] ?? []).filter((value) => value !== combo);
    if (remaining.length > 0) next[id] = remaining;
    else delete next[id];
    this.shortcutError = null;
    this.commitShortcuts(next, true);
  }

  private triggerShortcutCommand(id: FloatingButtonShortcutCommandId): void {
    this.getDockEntryElement(id)?.click();
  }

  triggerShortcut(id: FloatingButtonShortcutCommandId): void {
    this.triggerShortcutCommand(id);
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = FAB_HOST_ID;
    this.host.style.cssText = `position:fixed;z-index:2147483646;pointer-events:auto;transform:translate(-50%,-50%);transition:${SNAP_TRANSITION};`;
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    // Toolbar (outer column container)
    this.toolbarEl = document.createElement("div");
    this.toolbarEl.className = "toolbar";

    // Button row
    this.toolbarRowEl = document.createElement("div");
    this.toolbarRowEl.className = "toolbar-row";

    this.btnEl = this.createDockEntryButton("grab");
    this.gearEl = this.createDockEntryButton("settings");
    this.magnifierBtnEl = this.createDockEntryButton("magnifier");
    this.measurerBtnEl = this.createDockEntryButton("measurer");
    this.a11yIndicatorEl = this.createDockEntryButton("accessibility");

    this.logsBtnEl = this.createDockEntryButton("logs");
    this.logsBadgeEl = document.createElement("span");
    this.logsBadgeEl.className = "logs-badge";
    this.logsBadgeEl.style.display = "none";
    this.logsBtnEl.appendChild(this.logsBadgeEl);

    this.networkBtnEl = this.createDockEntryButton("network");
    this.networkBadgeEl = document.createElement("span");
    this.networkBadgeEl.className = "network-badge";
    this.networkBadgeEl.style.display = "none";
    this.networkBtnEl.appendChild(this.networkBadgeEl);

    this.renderToolbarEntries();

    this.toolbarEl.appendChild(this.toolbarRowEl);

    // Expandable body (separate card element)
    this.expandBodyEl = document.createElement("div");
    this.expandBodyEl.className = "expand-body";

    // Wrapper (flex column: bar + panel)
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.className = "fab-wrapper";
    this.wrapperEl.appendChild(this.toolbarEl);
    this.wrapperEl.appendChild(this.expandBodyEl);

    this.shadowRoot.appendChild(this.wrapperEl);

    this.applyDockLayout();

    // --- Event wiring ---

    // Drag: pointer events on toolbar row only
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.toolbarEl.addEventListener("pointerdown", this.boundPointerDown);
    this.toolbarEl.addEventListener("pointermove", this.boundPointerMove);
    this.toolbarEl.addEventListener("pointerup", this.boundPointerUp);

    // Click on grab button (toggle)
    this.btnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (this.isGrabActive) {
        this.toggleCb?.();
        return;
      }
      if (this.isMagnifierActive) return;
      if (this.isMeasurerActive) return;
      if (this.activePanel) {
        this.deactivatePanel();
        return;
      }
      this.toggleCb?.();
    });

    // Gear click → toggle settings panel
    this.gearEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (!this.canActivatePanel()) return;
      this.activatePanel("settings");
    });

    // A11y click → toggle accessibility panel
    this.a11yIndicatorEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (!this.canActivatePanel()) return;
      this.activatePanel("accessibility");
    });

    this.logsBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (!this.canActivatePanel()) return;
      this.activatePanel("logs");
    });

    this.networkBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (!this.canActivatePanel()) return;
      this.activatePanel("network");
    });

    // Magnifier click → toggle magnifier (no panel, direct toggle)
    this.magnifierBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (this.magnifierBtnEl!.classList.contains("disabled")) return;
      if (this.isMagnifierActive) {
        this.magnifierToggleCb?.();
        return;
      }
      if (this.isGrabActive) return;
      if (this.isMeasurerActive) return;
      if (this.activePanel) this.deactivatePanel();
      this.magnifierToggleCb?.();
    });

    // Measurer click → toggle measurer (no panel, direct toggle)
    this.measurerBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (!this.isMeasurerActive && (this.isGrabActive || this.isMagnifierActive)) return;
      if (this.activePanel) this.deactivatePanel();
      this.measurerToggleCb?.();
    });

    // Document: close on outside click
    this.boundDocClick = (e: MouseEvent) => {
      if (!this.activePanel) return;
      if (!this.closeOnOutsideClick) return;
      const path = e.composedPath();
      if (!path.includes(this.host!)) {
        this.deactivatePanel();
      }
    };
    document.addEventListener("click", this.boundDocClick, { capture: true });

    // Document: Escape closes panel or stops recording
    this.boundDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (this.recordingShortcutId) {
          this.stopShortcutRecording();
          e.preventDefault();
          e.stopPropagation();
        } else if (this.activePanel) {
          this.deactivatePanel();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener("keydown", this.boundDocKeyDown, { capture: true });
  }

  destroy(): void {
    if (this.boundDocClick) {
      document.removeEventListener("click", this.boundDocClick, { capture: true });
    }
    if (this.boundDocKeyDown) {
      document.removeEventListener("keydown", this.boundDocKeyDown, { capture: true });
    }
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
    }
    if (this.pendingRafId) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
    if (this.logsRenderRafId) {
      cancelAnimationFrame(this.logsRenderRafId);
      this.logsRenderRafId = null;
    }
    if (this.networkRenderRafId) {
      cancelAnimationFrame(this.networkRenderRafId);
      this.networkRenderRafId = null;
    }
    if (this.searchDebounceId != null) {
      window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
    if (this.networkSearchDebounceId != null) {
      window.clearTimeout(this.networkSearchDebounceId);
      this.networkSearchDebounceId = null;
    }
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.wrapperEl = null;
      this.toolbarEl = null;
      this.toolbarRowEl = null;
      this.expandBodyEl = null;
      this.btnEl = null;
      this.gearEl = null;
      this.a11yIndicatorEl = null;
      this.logsBtnEl = null;
      this.logsBadgeEl = null;
      this.networkBtnEl = null;
      this.networkBadgeEl = null;
      this.measurerBtnEl = null;
    }
  }

  setActive(active: boolean): void {
    this.isGrabActive = active;
    if (!this.btnEl) return;
    this.btnEl.classList.toggle("active", active);
  }

  setHighlightColor(color: string): void {
    this.host?.style.setProperty("--grab-color", color);
  }

  setCurrentHotkey(combo: string): void {
    this.setFirstShortcut("grab", combo, false);
  }

  onToggle(cb: () => void): void {
    this.toggleCb = cb;
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.hotkeyChangeCb = cb;
  }

  onShortcutsChange(cb: (shortcuts: FloatingButtonShortcutsConfig) => void): void {
    this.shortcutsChangeCb = cb;
  }

  onLogsClear(cb: () => void): void {
    this.logsClearCb = cb;
  }

  onMagnifierToggle(cb: () => void): void {
    this.magnifierToggleCb = cb;
  }

  onMagnifierConfigChange(cb: (config: { loupeSize?: number; zoomLevel?: number }) => void): void {
    this.magnifierConfigChangeCb = cb;
  }

  setMagnifierConfig(config: { loupeSize: number; zoomLevel: number }): void {
    this.magnifierLoupeSize = config.loupeSize;
    this.magnifierZoomLevel = config.zoomLevel;
  }

  setMagnifierActive(active: boolean): void {
    this.isMagnifierActive = active;
    if (!this.magnifierBtnEl) return;
    this.magnifierBtnEl.classList.toggle("active", active);
  }

  setMagnifierDisabled(disabled: boolean): void {
    if (!this.magnifierBtnEl) return;
    this.magnifierBtnEl.classList.toggle("disabled", disabled);
    this.magnifierBtnEl.title = disabled
      ? "Magnifier requires Chrome 138+ with html-in-canvas support"
      : "Magnifier loupe";
  }

  onMeasurerToggle(cb: () => void): void {
    this.measurerToggleCb = cb;
  }

  setMeasurerActive(active: boolean): void {
    this.isMeasurerActive = active;
    if (!this.measurerBtnEl) return;
    this.measurerBtnEl.classList.toggle("active", active);
  }

  getCurrentMeasurerHotkey(): string {
    return this.getShortcutCombos("measurer")[0] ?? "";
  }

  onMeasurerHotkeyChange(cb: (combo: string) => void): void {
    this.measurerHotkeyChangeCb = cb;
  }

  setCurrentMeasurerHotkey(combo: string): void {
    this.setFirstShortcut("measurer", combo, false);
  }

  // --- Panel activation (expand/collapse) ---

  private canActivatePanel(): boolean {
    return !this.isGrabActive && !this.isMagnifierActive && !this.isMeasurerActive;
  }

  private activatePanel(panel: PanelId): void {
    // Toggle off if already active
    if (this.activePanel === panel) {
      this.deactivatePanel();
      return;
    }
    this.preservedToolbarRect =
      this.dockMode === "float" ? (this.toolbarEl?.getBoundingClientRect() ?? null) : null;
    // Stop recording if switching away from settings
    if (this.recordingShortcutId) this.stopShortcutRecording();

    this.activePanel = panel;
    this.wrapperEl!.classList.add("expanded");

    this.expandBodyEl!.classList.add("open");
    this.renderExpandBody();
    this.applyDockLayout();
    this.updatePanelButtonStates();
  }

  private deactivatePanel(): void {
    if (!this.activePanel) return;
    this.clearPanelState();

    if (this.host && this.dockMode === "float") {
      this.host.style.transition = "none";
      this.host.style.transform = "translate(-50%, -50%)";
      this.applyPosition();
      this.pendingRafId = requestAnimationFrame(() => {
        this.pendingRafId = null;
        if (this.host) this.host.style.transition = SNAP_TRANSITION;
      });
    }

    if (this.dockMode !== "float") {
      this.preservedToolbarRect = null;
      this.applyDockLayout();
    } else {
      this.preservedToolbarRect = null;
      this.applyOrientation(this.getEdgeFromPosition());
    }
  }

  private updatePanelButtonStates(): void {
    this.gearEl?.classList.toggle("active", this.activePanel === "settings");
    this.a11yIndicatorEl?.classList.toggle("active", this.activePanel === "accessibility");
    this.logsBtnEl?.classList.toggle("active", this.activePanel === "logs");
    this.networkBtnEl?.classList.toggle("active", this.activePanel === "network");
  }

  // --- Content rendering ---

  private renderExpandBody(): void {
    if (!this.expandBodyEl) return;
    if (this.activePanel === "settings") {
      this.expandBodyEl.innerHTML = this.buildSettingsHTML();
      this.wireSettingsEvents();
    } else if (this.activePanel === "accessibility") {
      this.expandBodyEl.innerHTML = this.renderA11yPanelContent();
      this.wireA11yPanelEvents();
    } else if (this.activePanel === "logs") {
      const visible = this.visibleLogs();
      this.expandBodyEl.innerHTML = this.renderLogsPanelContent(visible);
      this.wireLogsPanelEvents(visible);
    } else if (this.activePanel === "network") {
      const visible = this.visibleNetwork();
      this.expandBodyEl.innerHTML = this.renderNetworkPanelContent(visible);
      this.wireNetworkPanelEvents(visible);
    }
  }

  // --- Settings content ---

  private buildSettingsHTML(): string {
    const editorOptions = EDITOR_PRESETS.map(
      (p) =>
        `<option value="${p.value}"${p.value === this.editorChoice ? " selected" : ""}>${p.label}</option>`,
    ).join("");
    const dockModeOptions = DOCK_MODE_OPTIONS.map(
      (p) =>
        `<button type="button" class="dock-mode-option${
          p.value === this.dockMode ? " active" : ""
        }" data-dock-mode="${p.value}" aria-pressed="${
          p.value === this.dockMode ? "true" : "false"
        }" title="${p.title}">${p.icon}<span>${p.label}</span></button>`,
    ).join("");

    const comp = this.lastGrabResult?.componentStack[0];
    const filePathText = comp?.filePath ? toRelativePath(comp.filePath) : "No element grabbed yet";
    const fileDisabled = !comp?.filePath;

    return `
      <div class="tab-bar">
        <button class="tab-btn${this.settingsTab === "dock" ? " active" : ""}" data-tab="dock">Dock</button>
        <button class="tab-btn${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab="shortcuts">Shortcuts</button>
        <button class="tab-btn${this.settingsTab === "tools" ? " active" : ""}" data-tab="tools">Tools</button>
      </div>
      <div class="tab-content${this.settingsTab === "dock" ? " active" : ""}" data-tab-content="dock">
        <div class="section-label">Panel</div>
        <div class="settings-list dock-settings-list">
          <div class="setting-row dock-mode-row" data-settings-row="dock-mode">
            <span class="setting-row-icon">${GEAR_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Dock mode</span>
              <span class="setting-row-description">How the DevTools panel is displayed.</span>
            </span>
            <span class="setting-row-control">
              <span class="dock-mode-group" role="group" aria-label="Dock mode">
                ${dockModeOptions}
              </span>
            </span>
          </div>
          <label class="setting-row setting-toggle-row" data-settings-row="outside-click">
            <span class="setting-row-icon">${CROSSHAIR_SVG}</span>
            <span class="setting-row-copy setting-toggle-copy">
              <span class="setting-row-title setting-toggle-title">Close panel on outside click</span>
              <span class="setting-row-description setting-toggle-description">Close the DevTools panel when clicking outside of it.</span>
            </span>
            <span class="setting-row-control">
              <input type="checkbox" class="setting-toggle-input outside-click-toggle"${
                this.closeOnOutsideClick ? " checked" : ""
              }>
              <span class="setting-toggle-switch" aria-hidden="true"></span>
            </span>
          </label>
        </div>
        <div class="section-label">Toolbar Entries</div>
        ${this.renderDockEntryManager()}
      </div>
      <div class="tab-content${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab-content="shortcuts">
        <div class="section-label">Shortcuts</div>
        <div class="settings-list shortcuts-list">
          ${this.renderShortcutRows()}
        </div>
      </div>
      <div class="tab-content${this.settingsTab === "tools" ? " active" : ""}" data-tab-content="tools">
        <div class="section-label">Editor</div>
        <div class="settings-list tools-list">
          <div class="setting-row tool-row" data-settings-row="editor-choice">
            <span class="setting-row-icon">${GEAR_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Preferred editor</span>
              <span class="setting-row-description">Choose the command used for source handoff.</span>
            </span>
            <span class="setting-row-control">
              <select class="editor-select">${editorOptions}</select>
            </span>
          </div>
          <div class="setting-row tool-row" data-settings-row="open-file">
            <span class="setting-row-icon">${LOGS_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Open grabbed file</span>
              <span class="setting-row-description file-path-display">${esc(filePathText)}</span>
            </span>
            <span class="setting-row-control">
              <button class="open-file-btn"${fileDisabled ? " disabled" : ""}>Open in Editor</button>
            </span>
          </div>
        </div>
        <div class="section-label">Magnifier</div>
        <div class="settings-list tools-list">
          <div class="setting-row tool-row" data-settings-row="magnifier-size">
            <span class="setting-row-icon">${MAGNIFIER_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Loupe size</span>
              <span class="setting-row-description">Adjust the diameter of the magnifier window.</span>
            </span>
            <span class="setting-row-control slider-row">
              <input type="range" class="magnifier-size-slider" min="100" max="600" step="50" value="${this.magnifierLoupeSize}">
              <span class="slider-value">${this.magnifierLoupeSize}px</span>
            </span>
          </div>
          <div class="setting-row tool-row" data-settings-row="magnifier-zoom">
            <span class="setting-row-icon">${MAGNIFIER_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Zoom level</span>
              <span class="setting-row-description">Control the loupe magnification factor.</span>
            </span>
            <span class="setting-row-control slider-row">
              <input type="range" class="magnifier-zoom-slider" min="1" max="8" step="0.5" value="${this.magnifierZoomLevel}">
              <span class="slider-value">${this.magnifierZoomLevel}x</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private renderShortcutRows(): string {
    return SHORTCUT_COMMAND_DEFINITIONS.map((command) => {
      const combos = this.getShortcutCombos(command.id);
      const isRecording = this.recordingShortcutId === command.id;
      const error =
        this.shortcutError && this.shortcutError.id === command.id
          ? this.shortcutError.message
          : "";
      const chips =
        combos.length > 0
          ? combos
              .map((combo, index) => {
                const label =
                  command.legacyKbdClass && index === 0
                    ? `<span class="${command.legacyKbdClass}">${esc(combo)}</span>`
                    : esc(combo);
                return `<span class="shortcut-chip" data-shortcut-chip="${command.id}" data-shortcut-combo="${esc(combo)}">${label}<button class="shortcut-remove-btn" type="button" data-shortcut-remove="${command.id}" data-shortcut-combo="${esc(combo)}" aria-label="Remove ${esc(combo)} shortcut">×</button></span>`;
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

  private renderDockEntryManager(): string {
    const hidden = new Set(this.dockEntries.hidden);
    let html = '<div class="dock-entry-manager">';

    for (const group of DOCK_ENTRY_GROUPS) {
      const entries = this.dockEntries.order
        .map((id) => DOCK_ENTRY_DEFINITION_BY_ID.get(id))
        .filter((entry): entry is DockEntryDefinition => entry?.group === group.id);
      if (entries.length === 0) continue;

      const hideable = entries.filter((entry) => !entry.locked);
      const visibleCount = entries.filter((entry) => entry.locked || !hidden.has(entry.id)).length;
      const hideableVisibleCount = hideable.filter((entry) => !hidden.has(entry.id)).length;
      const groupAllVisible = hideable.length === 0 || hideableVisibleCount === hideable.length;
      const groupPartial = hideableVisibleCount > 0 && hideableVisibleCount < hideable.length;

      html += `<div class="dock-entry-group" data-dock-group="${group.id}">`;
      html += '<div class="dock-entry-group-header">';
      html += `<span class="dock-entry-group-title">${esc(group.label)}</span>`;
      html += `<span class="dock-entry-group-count">(${visibleCount})</span>`;
      html += `<button class="dock-entry-group-toggle${groupPartial ? " is-partial" : ""}" type="button" data-dock-group-toggle="${group.id}"${
        hideable.length === 0 ? " disabled" : ""
      } aria-pressed="${groupAllVisible ? "true" : "false"}">${groupAllVisible ? "\u2713" : groupPartial ? "\u2013" : ""}</button>`;
      html += "</div>";
      html += '<div class="settings-list dock-entry-list">';

      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        const visible = entry.locked || !hidden.has(entry.id);
        const disableUp = index === 0;
        const disableDown = index === entries.length - 1;

        html += `<div class="setting-row dock-entry-row" data-dock-entry-row="${entry.id}" data-dock-group="${group.id}">`;
        html += `<span class="setting-row-icon dock-entry-icon">${entry.icon}</span>`;
        html += `<span class="setting-row-copy dock-entry-label"><span class="setting-row-title dock-entry-label-text">${esc(entry.label)}</span>${
          entry.badge ? `<span class="dock-entry-badge">${esc(entry.badge)}</span>` : ""
        }</span>`;
        html += '<span class="setting-row-control dock-entry-controls">';
        html += `<span class="dock-entry-drag" draggable="true" data-dock-entry-drag="${entry.id}" aria-label="Drag ${esc(entry.label)}" title="Drag to reorder">::</span>`;
        html += `<button class="dock-entry-check${visible ? "" : " is-hidden"}" type="button" data-dock-entry-toggle="${entry.id}" aria-pressed="${visible ? "true" : "false"}"${
          entry.locked ? " disabled" : ""
        } aria-label="${visible ? "Hide" : "Show"} ${esc(entry.label)}">${visible ? "\u2713" : ""}</button>`;
        if (entry.locked) {
          html += '<span class="dock-entry-lock">Locked</span>';
        }
        html += `<button class="dock-entry-move" type="button" data-dock-entry-move="${entry.id}" data-direction="up"${
          disableUp ? " disabled" : ""
        } aria-label="Move ${esc(entry.label)} up">\u2191</button>`;
        html += `<button class="dock-entry-move" type="button" data-dock-entry-move="${entry.id}" data-direction="down"${
          disableDown ? " disabled" : ""
        } aria-label="Move ${esc(entry.label)} down">\u2193</button>`;
        html += "</span>";
        html += "</div>";
      }

      html += "</div>";
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  private wireSettingsEvents(): void {
    if (!this.expandBodyEl) return;

    // Tab clicks
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".tab-btn"))) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const tabId = (btn as HTMLElement).dataset.tab as TabId;
        if (tabId) this.switchSettingsTab(tabId);
      });
    }

    // Dock: dock mode
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".dock-mode-option"))) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const dockMode = (btn as HTMLElement).dataset.dockMode;
        if (!dockMode || !isDockMode(dockMode)) return;
        this.setDockMode(dockMode, true);
        this.updateDockModeControls();
      });
    }

    // Dock: outside-click toggle
    const outsideClickToggle =
      this.expandBodyEl.querySelector<HTMLInputElement>(".outside-click-toggle");
    outsideClickToggle?.addEventListener("click", (e: Event) => e.stopPropagation());
    outsideClickToggle?.addEventListener("change", () => {
      this.closeOnOutsideClick = outsideClickToggle.checked;
      trySaveBoolean(this.config.closeOnOutsideClickStorageKey, this.closeOnOutsideClick);
    });

    this.wireDockEntryManagerEvents();

    // Editor: select
    const selectEl = this.expandBodyEl.querySelector<HTMLSelectElement>(".editor-select");
    selectEl?.addEventListener("change", () => {
      this.editorChoice = selectEl.value;
      trySaveEditor(this.config.editorStorageKey, this.editorChoice);
    });

    // Editor: open file button
    const openBtn = this.expandBodyEl.querySelector(".open-file-btn");
    openBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      const filePath = this.lastGrabResult?.componentStack[0]?.filePath;
      if (filePath) {
        const line = this.lastGrabResult?.componentStack[0]?.line;
        const editor = this.getEditorChoice();
        openInEditor(filePath, line, editor || undefined);
      }
    });

    // Shortcut recording and removal
    this.wireShortcutEvents();

    // Magnifier: loupe size slider
    const sizeSlider = this.expandBodyEl.querySelector<HTMLInputElement>(".magnifier-size-slider");
    sizeSlider?.addEventListener("input", () => {
      const val = Number(sizeSlider.value);
      this.magnifierLoupeSize = val;
      const label = sizeSlider.parentElement?.querySelector(".slider-value");
      if (label) label.textContent = `${val}px`;
      this.magnifierConfigChangeCb?.({ loupeSize: val });
    });

    // Magnifier: zoom level slider
    const zoomSlider = this.expandBodyEl.querySelector<HTMLInputElement>(".magnifier-zoom-slider");
    zoomSlider?.addEventListener("input", () => {
      const val = Number(zoomSlider.value);
      this.magnifierZoomLevel = val;
      const label = zoomSlider.parentElement?.querySelector(".slider-value");
      if (label) label.textContent = `${val}x`;
      this.magnifierConfigChangeCb?.({ zoomLevel: val });
    });
  }

  private wireShortcutEvents(): void {
    if (!this.expandBodyEl) return;

    for (const btn of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-shortcut-record]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.shortcutRecord;
        if (!isDockEntryId(id)) return;
        this.toggleShortcutRecording(id);
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-shortcut-remove]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.shortcutRemove;
        const combo = btn.dataset.shortcutCombo;
        if (!isDockEntryId(id) || !combo) return;
        this.removeShortcut(id, combo);
      });
    }
  }

  private wireDockEntryManagerEvents(): void {
    if (!this.expandBodyEl) return;

    for (const btn of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-dock-entry-toggle]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.dockEntryToggle;
        if (!isDockEntryId(id) || id === "settings") return;
        this.toggleDockEntryVisibility(id);
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-dock-group-toggle]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const groupId = btn.dataset.dockGroupToggle as DockEntryGroupId | undefined;
        if (!groupId) return;
        this.toggleDockEntryGroupVisibility(groupId);
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-dock-entry-move]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.dockEntryMove;
        const direction = btn.dataset.direction;
        if (!isDockEntryId(id) || (direction !== "up" && direction !== "down")) return;
        this.moveDockEntryWithinGroup(id, direction);
      });
    }

    for (const handle of this.expandBodyEl.querySelectorAll<HTMLElement>(
      "[data-dock-entry-drag]",
    )) {
      handle.addEventListener("dragstart", (e: DragEvent) => {
        e.stopPropagation();
        const id = handle.dataset.dockEntryDrag;
        if (!isDockEntryId(id)) return;
        this.dockEntryDragId = id;
        e.dataTransfer?.setData("text/plain", id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        handle.closest<HTMLElement>("[data-dock-entry-row]")?.classList.add("is-dragging");
      });

      handle.addEventListener("dragend", (e: DragEvent) => {
        e.stopPropagation();
        this.dockEntryDragId = null;
        this.clearDockEntryDragState();
      });
    }

    for (const row of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-dock-entry-row]")) {
      row.addEventListener("dragover", (e: DragEvent) => {
        const dragId = this.dockEntryDragId;
        const targetId = row.dataset.dockEntryRow;
        if (!isDockEntryId(dragId) || !isDockEntryId(targetId)) return;
        if (!this.canDropDockEntryOn(dragId, targetId)) {
          this.clearDockEntryDropTargets();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        this.setDockEntryDropTarget(row, this.getDockEntryDropPlacement(row, e));
      });

      row.addEventListener("dragleave", (e: DragEvent) => {
        const relatedTarget = e.relatedTarget;
        if (relatedTarget instanceof Node && row.contains(relatedTarget)) return;
        row.classList.remove("is-drop-before", "is-drop-after");
      });

      row.addEventListener("drop", (e: DragEvent) => {
        const dragId = this.dockEntryDragId;
        const targetId = row.dataset.dockEntryRow;
        if (!isDockEntryId(dragId) || !isDockEntryId(targetId)) return;
        if (!this.canDropDockEntryOn(dragId, targetId)) {
          this.clearDockEntryDragState();
          this.dockEntryDragId = null;
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        const placement = this.getDockEntryDropPlacement(row, e);
        this.clearDockEntryDragState();
        this.dockEntryDragId = null;
        this.reorderDockEntryWithinGroup(dragId, targetId, placement);
      });
    }
  }

  private persistDockEntries(): void {
    trySaveDockEntries(this.dockEntriesStorageKey, this.dockEntries);
  }

  private commitDockEntries(patch: Partial<FloatingButtonDockEntriesConfig>): void {
    this.dockEntries = normalizeDockEntries({ ...this.dockEntries, ...patch });
    this.persistDockEntries();
    this.refreshDockEntryUi();
  }

  private refreshDockEntryUi(): void {
    this.renderToolbarEntries();
    this.updateLogsBadge();
    this.updateNetworkBadge();
    this.updatePanelButtonStates();
    this.applyDockLayout();
    if (this.activePanel === "settings") this.renderExpandBody();
  }

  private toggleDockEntryVisibility(id: FloatingButtonDockEntryId): void {
    if (id === "settings") return;
    const hidden = new Set(this.dockEntries.hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    hidden.delete("settings");
    this.commitDockEntries({ hidden: [...hidden] });
  }

  private toggleDockEntryGroupVisibility(groupId: DockEntryGroupId): void {
    const groupEntries = this.dockEntries.order.filter((id) => {
      const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
      return def?.group === groupId && !def.locked;
    });
    if (groupEntries.length === 0) return;
    const hidden = new Set(this.dockEntries.hidden);
    const allVisible = groupEntries.every((id) => !hidden.has(id));
    for (const id of groupEntries) {
      if (allVisible) hidden.add(id);
      else hidden.delete(id);
    }
    hidden.delete("settings");
    this.commitDockEntries({ hidden: [...hidden] });
  }

  private moveDockEntryWithinGroup(id: FloatingButtonDockEntryId, direction: "up" | "down"): void {
    const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
    if (!def) return;

    const groupIds = this.dockEntries.order.filter(
      (entryId) => DOCK_ENTRY_DEFINITION_BY_ID.get(entryId)?.group === def.group,
    );
    const groupIndex = groupIds.indexOf(id);
    const swapGroupIndex = direction === "up" ? groupIndex - 1 : groupIndex + 1;
    const swapId = groupIds[swapGroupIndex];
    if (!swapId) return;

    const order = [...this.dockEntries.order];
    const index = order.indexOf(id);
    const swapIndex = order.indexOf(swapId);
    if (index < 0 || swapIndex < 0) return;
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];

    this.commitDockEntries({ order });
  }

  private reorderDockEntryWithinGroup(
    dragId: FloatingButtonDockEntryId,
    targetId: FloatingButtonDockEntryId,
    placement: DockEntryDropPlacement,
  ): void {
    if (!this.canDropDockEntryOn(dragId, targetId)) return;

    const orderWithoutDrag = this.dockEntries.order.filter((id) => id !== dragId);
    const targetIndex = orderWithoutDrag.indexOf(targetId);
    if (targetIndex < 0) return;

    const insertIndex = placement === "before" ? targetIndex : targetIndex + 1;
    const order = [...orderWithoutDrag];
    order.splice(insertIndex, 0, dragId);

    this.commitDockEntries({ order });
  }

  private canDropDockEntryOn(
    dragId: FloatingButtonDockEntryId,
    targetId: FloatingButtonDockEntryId,
  ): boolean {
    if (dragId === targetId) return false;
    const dragDef = DOCK_ENTRY_DEFINITION_BY_ID.get(dragId);
    const targetDef = DOCK_ENTRY_DEFINITION_BY_ID.get(targetId);
    return Boolean(dragDef && targetDef && dragDef.group === targetDef.group);
  }

  private getDockEntryDropPlacement(row: HTMLElement, e: DragEvent): DockEntryDropPlacement {
    const rect = row.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  private setDockEntryDropTarget(row: HTMLElement, placement: DockEntryDropPlacement): void {
    if (this.dockEntryDropTargetEl && this.dockEntryDropTargetEl !== row) {
      this.dockEntryDropTargetEl.classList.remove("is-drop-before", "is-drop-after");
    }
    row.classList.add(placement === "before" ? "is-drop-before" : "is-drop-after");
    row.classList.remove(placement === "before" ? "is-drop-after" : "is-drop-before");
    this.dockEntryDropTargetEl = row;
  }

  private clearDockEntryDropTargets(): void {
    this.dockEntryDropTargetEl?.classList.remove("is-drop-before", "is-drop-after");
    this.dockEntryDropTargetEl = null;
  }

  private clearDockEntryDragState(): void {
    if (!this.expandBodyEl) return;
    for (const row of this.expandBodyEl.querySelectorAll<HTMLElement>("[data-dock-entry-row]")) {
      row.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    }
    this.dockEntryDropTargetEl = null;
  }

  private switchSettingsTab(tabId: TabId): void {
    this.settingsTab = tabId;
    if (!this.expandBodyEl) return;
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".tab-btn"))) {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.tab === tabId);
    }
    for (const content of Array.from(this.expandBodyEl.querySelectorAll(".tab-content"))) {
      content.classList.toggle("active", (content as HTMLElement).dataset.tabContent === tabId);
    }
  }

  private updateDockModeControls(): void {
    if (!this.expandBodyEl) return;
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".dock-mode-option"))) {
      const active = (btn as HTMLElement).dataset.dockMode === this.dockMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  private setDockMode(mode: FloatingButtonDockMode, persist: boolean): void {
    if (mode === this.dockMode) return;
    const previousMode = this.dockMode;
    this.dockMode = mode;
    if (persist) trySaveDockMode(this.config.dockModeStorageKey, mode);

    if (previousMode === "edge" && mode === "float") {
      this.restoreFloatPositionFromEdge(this.getEdgeFromPosition());
    }
    this.applyDockLayout();
    if (this.activePanel) this.renderExpandBody();
  }

  private updateEditorTabInPlace(): void {
    if (!this.expandBodyEl || this.activePanel !== "settings") return;
    const filePathEl = this.expandBodyEl.querySelector(".file-path-display");
    const openBtn = this.expandBodyEl.querySelector<HTMLButtonElement>(".open-file-btn");
    if (!filePathEl || !openBtn) return;

    const comp = this.lastGrabResult?.componentStack[0];
    if (comp?.filePath) {
      filePathEl.textContent = toRelativePath(comp.filePath);
      openBtn.disabled = false;
    } else {
      filePathEl.textContent = "No element grabbed yet";
      openBtn.disabled = true;
    }
  }

  // --- Accessibility panel ---

  private renderA11yPanelContent(forceRescan = false): string {
    if (forceRescan || !this.cachedA11yResults) {
      this.cachedA11yResults = scanPageA11y();
      this.lastA11yScanTime = Date.now();
    }
    const results = this.cachedA11yResults;

    if (results.length === 0) {
      return '<div class="a11y-panel"><div class="a11y-empty">No Vue components found on this page</div></div>';
    }

    const passing = results.filter((r) => r.a11y.hasA11y && r.a11y.audit.length === 0);
    const issues = results.filter((r) => r.a11y.audit.length > 0);
    const neutral = results.filter((r) => !r.a11y.hasA11y && r.a11y.audit.length === 0);

    let html = '<div class="a11y-panel">';

    // Header with re-scan
    html += '<div class="a11y-header">';
    html += '<span class="a11y-title">Accessibility Audit</span>';
    html += '<button class="a11y-rescan-btn">Re-scan</button>';
    html += "</div>";

    html += '<div class="section-label">Summary</div>';
    html += '<div class="a11y-summary a11y-summary-strip">';
    html += `<span><span class="a11y-summary-count pass">${passing.length}</span> passing</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count fail">${issues.length}</span> with issues</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count neutral">${neutral.length}</span> no a11y attrs</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count">${results.length}</span> total</span>`;
    html += "</div>";

    let idx = 0;
    const sections = [
      { items: issues, label: "Issues", status: "fail" },
      { items: neutral, label: "No Accessibility", status: "neutral" },
      { items: passing, label: "Passing", status: "pass" },
    ] satisfies Array<{
      items: typeof results;
      label: string;
      status: "fail" | "neutral" | "pass";
    }>;

    for (const { items, label, status } of sections) {
      if (items.length === 0) continue;
      html += `<div class="section-label a11y-group-label">${label} <span class="a11y-group-count">${items.length}</span></div>`;
      html += '<div class="settings-list a11y-audit-list">';
      for (const item of items) {
        html += this.renderA11yRow(item, status, idx++);
      }
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  private renderA11yRow(
    item: ReturnType<typeof scanPageA11y>[number],
    status: "pass" | "fail" | "neutral",
    idx: number,
  ): string {
    const icon = status === "pass" ? "\u2713" : status === "fail" ? "\u26A0" : "\u2014";
    const statusLabel = status === "pass" ? "Passing" : status === "fail" ? "Issue" : "No a11y";
    const hasChildren = item.childElements.length > 0;

    let html = hasChildren ? `<div class="a11y-row-toggle" data-a11y-idx="${idx}">` : "";
    html += `<div class="setting-row a11y-row" data-a11y-row="${idx}" data-a11y-status="${status}">`;
    html += `<span class="setting-row-icon a11y-row-icon ${status}" aria-hidden="true">${icon}</span>`;
    html += '<span class="setting-row-copy">';

    // Component name with optional chevron and count
    html += '<span class="setting-row-title a11y-row-name">';
    if (hasChildren) {
      html += '<span class="a11y-row-chevron">\u25B6</span> ';
    }
    html += `&lt;${esc(item.componentName)}&gt;`;
    html += "</span>";

    if (item.filePath) {
      html += `<span class="setting-row-description a11y-row-file">${esc(toRelativePath(item.filePath))}</span>`;
    }

    // Show attributes if passing
    if (status === "pass" && item.a11y.attributes.length > 0) {
      const attrNames = item.a11y.attributes.map((a) => a.name).join(", ");
      html += `<span class="setting-row-description a11y-row-detail">${esc(attrNames)}</span>`;
    }

    html += "</span>";
    html += '<span class="setting-row-control a11y-row-control">';
    if (hasChildren) {
      html += `<span class="a11y-row-count">${item.childElements.length}</span>`;
    } else {
      html += `<span class="a11y-status-chip ${status}">${statusLabel}</span>`;
    }
    html += "</span>";
    html += "</div>";

    // Child element details (hidden by default)
    if (hasChildren) {
      html += `<div class="a11y-child-details" data-a11y-details="${idx}">`;
      html += '<div class="a11y-child-surface">';
      for (const child of item.childElements) {
        html += '<div class="a11y-child-row">';
        html += `<div class="a11y-child-tag">&lt;${esc(child.selector)}&gt;</div>`;
        if (child.a11y.audit.length > 0) {
          for (const audit of child.a11y.audit) {
            html += `<div class="a11y-child-msg warning">${esc(audit.message)}</div>`;
          }
        } else if (child.a11y.hasA11y) {
          const attrs = child.a11y.attributes.map((a) => a.name).join(", ");
          html += `<div class="a11y-child-msg pass">\u2713 ${esc(attrs)}</div>`;
        } else {
          html += '<div class="a11y-child-msg neutral">no a11y attributes</div>';
        }
        html += "</div>";
      }
      html += "</div>";
      html += "</div>";
    }

    if (hasChildren) html += "</div>";
    return html;
  }

  private wireA11yPanelEvents(): void {
    if (!this.expandBodyEl) return;

    // Re-scan button with debounce
    const rescanBtn = this.expandBodyEl.querySelector(".a11y-rescan-btn");
    rescanBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      if (Date.now() - this.lastA11yScanTime < 500) return;
      (rescanBtn as HTMLElement).textContent = "Scanning\u2026";
      rescanBtn.classList.add("a11y-rescan-btn--loading");
      requestAnimationFrame(() => {
        if (!this.expandBodyEl || this.activePanel !== "accessibility") return;
        this.expandBodyEl.innerHTML = this.renderA11yPanelContent(true);
        this.wireA11yPanelEvents();
      });
    });

    // Expand/collapse child details
    for (const toggle of this.expandBodyEl.querySelectorAll(".a11y-row-toggle")) {
      toggle.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = (toggle as HTMLElement).dataset.a11yIdx;
        const details = this.expandBodyEl?.querySelector(`[data-a11y-details="${idx}"]`);
        const chevron = toggle.querySelector(".a11y-row-chevron");
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }
  }

  // --- Console (logs) panel ---

  setLogs(entries: CapturedLog[]): void {
    this.logEntries = entries;
    if (this.activePanel === "logs") {
      this.scheduleLogsRender();
    } else {
      this.updateLogsBadge();
    }
  }

  private scheduleLogsRender(): void {
    if (this.logsRenderRafId != null) return;
    this.logsRenderRafId = requestAnimationFrame(() => {
      this.logsRenderRafId = null;
      this.updateLogsBadge();
      if (this.activePanel === "logs") this.renderExpandBody();
    });
  }

  private updateLogsBadge(): void {
    if (!this.logsBadgeEl) return;
    let count = 0;
    let hasError = false;
    for (const e of this.logEntries) {
      if (e.level === "error") {
        count++;
        hasError = true;
      } else if (e.level === "warn") {
        count++;
      }
    }
    this.logsBadgeEl.textContent = count > 99 ? "99+" : String(count);
    this.logsBadgeEl.style.display = count > 0 ? "" : "none";
    this.logsBadgeEl.classList.toggle("has-error", hasError);
  }

  private countsByLevel(): Record<LogLevel, number> {
    const out: Record<LogLevel, number> = { log: 0, info: 0, warn: 0, error: 0, debug: 0 };
    for (const e of this.logEntries) out[e.level]++;
    return out;
  }

  private visibleLogs(): CapturedLog[] {
    const needle = this.searchTerm.toLowerCase();
    const filtered = this.logEntries.filter(
      (e) =>
        this.filterLevels.has(e.level) &&
        (needle === "" || e.message.toLowerCase().includes(needle)),
    );
    return filtered.toSorted((a, b) => b.timestamp - a.timestamp);
  }

  private renderLogsPanelContent(visible: CapturedLog[]): string {
    const counts = this.countsByLevel();
    const totalCount = this.logEntries.length;
    const visibleCount = visible.length;
    const isCapturedEmpty = totalCount === 0;
    const meta = isCapturedEmpty
      ? "No entries yet"
      : `${visibleCount} of ${totalCount} ${totalCount === 1 ? "entry" : "entries"}`;
    const pills = ALL_LOG_LEVELS.map((lvl) => {
      const active = this.filterLevels.has(lvl);
      return `<button class="logs-pill${active ? " active" : ""}" data-level="${lvl}" type="button">${lvl}<span class="count">${counts[lvl]}</span></button>`;
    }).join("");

    let html = `<div class="logs-panel${isCapturedEmpty ? " is-empty" : ""}">`;
    html += '<div class="logs-header">';
    html += '<span class="logs-panel-heading">';
    html += '<span class="logs-title">Console</span>';
    html += `<span class="logs-panel-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += '<button class="logs-clear-btn" type="button">Clear</button>';
    html += "</div>";
    html += '<div class="section-label logs-section-label">Levels</div>';
    html += `<div class="logs-filter-bar">${pills}</div>`;

    if (isCapturedEmpty) {
      html += '<div class="logs-empty-compact">No logs captured yet</div></div>';
      return html;
    }

    html += '<div class="logs-search-row">';
    html += `<input class="logs-search" type="text" placeholder="Filter messages…" value="${esc(this.searchTerm)}">`;
    html += "</div>";

    if (visible.length === 0) {
      const empty = "No logs match the current filter";
      html += `<div class="logs-list"><div class="logs-empty">${empty}</div></div></div>`;
      return html;
    }

    html += '<div class="section-label logs-section-label">Entries</div>';
    html += '<div class="logs-list">';
    for (let i = 0; i < visible.length; i++) {
      const log = visible[i];
      const time = new Date(log.timestamp).toLocaleTimeString();
      const msgTrunc = truncate(log.message, 120);

      html += `<div class="log-row" data-level="${log.level}" data-log-idx="${i}">`;
      html += '<button class="log-row-header" type="button">';
      html += `<span class="log-row-chevron" data-log-toggle="${i}">\u25B6</span>`;
      html += `<span class="log-row-level">${esc(log.level)}</span>`;
      if (log.source !== "console") {
        html += `<span class="log-row-source">${esc(log.source)}</span>`;
      }
      html += `<span class="log-row-msg" title="${esc(log.message)}">${esc(msgTrunc)}</span>`;
      if (log.count > 1) {
        html += `<span class="log-row-count">\u00D7${log.count}</span>`;
      }
      html += `<span class="log-row-time">${esc(time)}</span>`;
      html += "</button>";

      html += `<div class="log-row-details" data-log-details="${i}">`;
      html += '<div class="log-row-detail-surface">';
      if (log.vueInfo) {
        html += `<div class="log-row-vue-info">Vue: ${esc(log.vueInfo)}</div>`;
      }
      if (log.stack) {
        html += `<div class="log-row-stack">${esc(log.stack)}</div>`;
      }
      html += '<div class="log-row-actions">';
      html += `<button class="log-action-btn" data-log-copy="${i}" type="button">Copy</button>`;
      html += `<button class="log-action-btn primary" data-log-claude="${i}" type="button">Open in Claude Code</button>`;
      if (log.sourceFile || log.componentStack?.[0]?.filePath) {
        html += `<button class="log-action-btn" data-log-open="${i}" type="button">Open in Editor</button>`;
      }
      html += "</div>";
      html += "</div>";
      html += "</div>";

      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
    return html;
  }

  private wireLogsPanelEvents(sorted: CapturedLog[]): void {
    if (!this.expandBodyEl) return;

    const clearBtn = this.expandBodyEl.querySelector(".logs-clear-btn");
    clearBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.logsClearCb?.();
    });

    for (const pill of this.expandBodyEl.querySelectorAll<HTMLElement>(".logs-pill")) {
      pill.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const lvl = pill.dataset.level as LogLevel | undefined;
        if (!lvl) return;
        if (this.filterLevels.has(lvl)) this.filterLevels.delete(lvl);
        else this.filterLevels.add(lvl);
        this.renderExpandBody();
      });
    }

    const searchInput = this.expandBodyEl.querySelector<HTMLInputElement>(".logs-search");
    searchInput?.addEventListener("input", () => {
      this.searchTerm = searchInput.value;
      if (this.searchDebounceId != null) window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = window.setTimeout(() => {
        this.searchDebounceId = null;
        if (this.activePanel !== "logs") return;
        this.renderExpandBody();
        const fresh = this.expandBodyEl?.querySelector<HTMLInputElement>(".logs-search");
        if (fresh && document.activeElement !== fresh) {
          fresh.focus();
          const pos = this.searchTerm.length;
          fresh.setSelectionRange(pos, pos);
        }
      }, 120);
    });
    searchInput?.addEventListener("click", (e: Event) => e.stopPropagation());
    searchInput?.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

    for (const header of this.expandBodyEl.querySelectorAll(".log-row-header")) {
      header.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const row = (header as HTMLElement).closest(".log-row");
        const idx = row?.getAttribute("data-log-idx");
        if (idx == null) return;
        const details = this.expandBodyEl?.querySelector(`[data-log-details="${idx}"]`);
        const chevron = this.expandBodyEl?.querySelector(`[data-log-toggle="${idx}"]`);
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-log-copy]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logCopy);
        const log = sorted[idx];
        if (!log) return;
        const prompt = buildLogPrompt(log);
        navigator.clipboard.writeText(prompt).then(() => {
          (btn as HTMLElement).textContent = "Copied!";
          setTimeout(() => {
            (btn as HTMLElement).textContent = "Copy";
          }, 1500);
        });
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-log-claude]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logClaude);
        const log = sorted[idx];
        if (!log) return;
        const prompt = buildLogPrompt(log);
        openInClaudeCode(prompt);
        (btn as HTMLElement).textContent = "Opened!";
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Open in Claude Code";
        }, 1500);
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-log-open]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logOpen);
        const log = sorted[idx];
        if (!log) return;
        const source = resolveLogSource(log);
        if (!source) return;
        const editor = this.getEditorChoice();
        openInEditor(source.file, source.line, editor || undefined);
      });
    }
  }

  // --- Network panel ---

  setNetwork(entries: CapturedRequest[]): void {
    this.networkEntries = entries;
    if (this.activePanel === "network") {
      this.scheduleNetworkRender();
    } else {
      this.updateNetworkBadge();
    }
  }

  onNetworkClear(cb: () => void): void {
    this.networkClearCb = cb;
  }

  private scheduleNetworkRender(): void {
    if (this.networkRenderRafId != null) return;
    this.networkRenderRafId = requestAnimationFrame(() => {
      this.networkRenderRafId = null;
      this.updateNetworkBadge();
      if (this.activePanel === "network") this.renderExpandBody();
    });
  }

  private updateNetworkBadge(): void {
    if (!this.networkBadgeEl) return;
    let count = 0;
    let hasError = false;
    for (const e of this.networkEntries) {
      if (NETWORK_ERROR_CLASSES.has(e.statusClass)) {
        count++;
        hasError = true;
      } else if (NETWORK_WARN_CLASSES.has(e.statusClass)) {
        count++;
      }
    }
    if (
      this.lastNetworkBadge &&
      this.lastNetworkBadge.count === count &&
      this.lastNetworkBadge.hasError === hasError
    ) {
      return;
    }
    this.lastNetworkBadge = { count, hasError };
    this.networkBadgeEl.textContent = count > 99 ? "99+" : String(count);
    this.networkBadgeEl.style.display = count > 0 ? "" : "none";
    this.networkBadgeEl.classList.toggle("has-error", hasError);
  }

  private countsByStatusClass(): Record<NetworkStatusClass, number> {
    const out: Record<NetworkStatusClass, number> = {
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0,
      failed: 0,
    };
    for (const e of this.networkEntries) out[e.statusClass]++;
    return out;
  }

  private visibleNetwork(): CapturedRequest[] {
    const needle = this.networkSearchTerm.toLowerCase();
    const filtered = this.networkEntries.filter(
      (e) =>
        this.networkFilterStatus.has(e.statusClass) &&
        (needle === "" || e.url.toLowerCase().includes(needle)),
    );
    return filtered.toSorted((a, b) => b.timestamp - a.timestamp);
  }

  private renderNetworkPanelContent(visible: CapturedRequest[]): string {
    const counts = this.countsByStatusClass();
    const pills = ALL_NETWORK_STATUS_CLASSES.map((cls) => {
      const active = this.networkFilterStatus.has(cls);
      return `<button class="net-pill${active ? " active" : ""}" data-status="${cls}" type="button">${cls}<span class="count">${counts[cls]}</span></button>`;
    }).join("");

    let html = '<div class="network-panel">';
    html += '<div class="logs-header">';
    html += '<span class="logs-title">Network</span>';
    html += '<button class="logs-clear-btn net-clear-btn" type="button">Clear</button>';
    html += "</div>";
    html += `<div class="logs-filter-bar">${pills}</div>`;
    html += `<input class="logs-search net-search" type="text" placeholder="Filter by URL…" value="${esc(this.networkSearchTerm)}">`;

    if (visible.length === 0) {
      const empty =
        this.networkEntries.length === 0
          ? "No network activity captured"
          : "No requests match the current filter";
      html += `<div class="logs-empty">${empty}</div></div>`;
      return html;
    }

    for (let i = 0; i < visible.length; i++) {
      const req = visible[i];
      const time = new Date(req.timestamp).toLocaleTimeString();
      const statusLabel = formatNetworkStatusLabel(req);
      const duration = req.duration != null ? `${Math.round(req.duration)}ms` : "";
      const urlTrunc = truncate(req.url, 160);

      html += `<div class="net-row" data-status="${req.statusClass}" data-net-idx="${i}">`;
      html += '<div class="net-row-header">';
      html += `<span class="net-row-chevron" data-net-toggle="${i}">\u25B6</span>`;
      html += `<span class="net-row-method">${esc(req.method)}</span>`;
      html += `<span class="net-row-status">${esc(statusLabel)}</span>`;
      html += `<span class="net-row-url" title="${esc(req.url)}">${esc(urlTrunc)}</span>`;
      if (req.count > 1) {
        html += `<span class="net-row-count">\u00D7${req.count}</span>`;
      }
      if (duration) html += `<span class="net-row-duration">${duration}</span>`;
      html += `<span class="net-row-time">${esc(time)}</span>`;
      html += "</div>";

      html += `<div class="net-row-details" data-net-details="${i}">`;
      if (req.error) {
        html += `<div class="net-row-error">Error: ${esc(req.error)}</div>`;
      }
      if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
        html += `<div class="net-section-title">Request headers</div>`;
        for (const [k, v] of Object.entries(req.requestHeaders)) {
          html += `<div class="net-kv"><span class="k">${esc(k)}</span>: ${esc(v)}</div>`;
        }
      }
      if (req.requestBody) {
        html += `<div class="net-section-title">Request body</div>`;
        html += `<div class="net-body">${esc(req.requestBody)}</div>`;
      }
      if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
        html += `<div class="net-section-title">Response headers</div>`;
        for (const [k, v] of Object.entries(req.responseHeaders)) {
          html += `<div class="net-kv"><span class="k">${esc(k)}</span>: ${esc(v)}</div>`;
        }
      }
      if (req.responseBody) {
        html += `<div class="net-section-title">Response body</div>`;
        html += `<div class="net-body">${esc(req.responseBody)}</div>`;
      }
      html += '<div class="log-row-actions">';
      html += `<button class="log-action-btn" data-net-copy="${i}" type="button">Copy</button>`;
      html += `<button class="log-action-btn primary" data-net-claude="${i}" type="button">Open in Claude Code</button>`;
      if (req.sourceFile) {
        html += `<button class="log-action-btn" data-net-open="${i}" type="button">Open in Editor</button>`;
      }
      html += "</div>";
      html += "</div>";

      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  private wireNetworkPanelEvents(sorted: CapturedRequest[]): void {
    if (!this.expandBodyEl) return;

    const clearBtn = this.expandBodyEl.querySelector(".net-clear-btn");
    clearBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.networkClearCb?.();
    });

    for (const pill of this.expandBodyEl.querySelectorAll<HTMLElement>(".net-pill")) {
      pill.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const cls = pill.dataset.status as NetworkStatusClass | undefined;
        if (!cls) return;
        if (this.networkFilterStatus.has(cls)) this.networkFilterStatus.delete(cls);
        else this.networkFilterStatus.add(cls);
        this.renderExpandBody();
      });
    }

    const searchInput = this.expandBodyEl.querySelector<HTMLInputElement>(".net-search");
    searchInput?.addEventListener("input", () => {
      this.networkSearchTerm = searchInput.value;
      if (this.networkSearchDebounceId != null) window.clearTimeout(this.networkSearchDebounceId);
      this.networkSearchDebounceId = window.setTimeout(() => {
        this.networkSearchDebounceId = null;
        if (this.activePanel !== "network") return;
        this.renderExpandBody();
        const fresh = this.expandBodyEl?.querySelector<HTMLInputElement>(".net-search");
        if (fresh && document.activeElement !== fresh) {
          fresh.focus();
          const pos = this.networkSearchTerm.length;
          fresh.setSelectionRange(pos, pos);
        }
      }, 120);
    });
    searchInput?.addEventListener("click", (e: Event) => e.stopPropagation());
    searchInput?.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

    for (const header of this.expandBodyEl.querySelectorAll(".net-row-header")) {
      header.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const row = (header as HTMLElement).closest(".net-row");
        const idx = row?.getAttribute("data-net-idx");
        if (idx == null) return;
        const details = this.expandBodyEl?.querySelector(`[data-net-details="${idx}"]`);
        const chevron = this.expandBodyEl?.querySelector(`[data-net-toggle="${idx}"]`);
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-net-copy]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netCopy);
        const req = sorted[idx];
        if (!req) return;
        const prompt = buildRequestPrompt(req);
        navigator.clipboard.writeText(prompt).then(() => {
          (btn as HTMLElement).textContent = "Copied!";
          setTimeout(() => {
            (btn as HTMLElement).textContent = "Copy";
          }, 1500);
        });
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-net-claude]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netClaude);
        const req = sorted[idx];
        if (!req) return;
        const prompt = buildRequestPrompt(req);
        openInClaudeCode(prompt);
        (btn as HTMLElement).textContent = "Opened!";
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Open in Claude Code";
        }, 1500);
      });
    }

    for (const btn of this.expandBodyEl.querySelectorAll("[data-net-open]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netOpen);
        const req = sorted[idx];
        if (!req) return;
        const source = resolveRequestSource(req);
        if (!source) return;
        const editor = this.getEditorChoice();
        openInEditor(source.file, source.line, editor || undefined);
      });
    }
  }

  // --- Dock layout ---

  private applyDockLayout(): void {
    if (!this.host || !this.wrapperEl || !this.toolbarEl) return;
    const edge = this.getEdgeFromPosition();
    if (this.dockMode === "edge" && this.isDragging && this.lastAppliedEdge === edge) {
      return;
    }
    this.host.style.transition = this.isDragging ? "none" : SNAP_TRANSITION;
    this.resetDockClasses();

    if (this.dockMode === "edge") {
      this.preservedToolbarRect = null;
      this.lastAppliedEdge = edge;
      this.applyEdgeLayout(edge);
    } else if (this.activePanel) {
      this.lastAppliedEdge = null;
      this.applyFloatExpandedLayout(edge, this.preservedToolbarRect);
      this.preservedToolbarRect = null;
    } else {
      this.lastAppliedEdge = null;
      this.applyFloatClosedLayout(edge);
    }
  }

  private resetDockClasses(): void {
    if (!this.wrapperEl || !this.toolbarEl) return;
    this.wrapperEl.classList.remove("edge", "edge-top", "edge-bottom", "edge-left", "edge-right");
    this.toolbarEl.classList.remove("vertical");
  }

  private resetLayoutStyles(): void {
    if (!this.host) return;
    this.host.style.position = "fixed";
    this.host.style.inset = "";
    this.host.style.width = "";
    this.host.style.height = "";
    this.host.style.left = "";
    this.host.style.top = "";
    this.host.style.right = "";
    this.host.style.bottom = "";
    this.host.style.transform = "";
  }

  private applyFloatClosedLayout(edge: DockEdge): void {
    if (!this.host) return;
    this.resetLayoutStyles();
    this.host.style.transform = "translate(-50%, -50%)";
    this.applyPosition();
    this.applyOrientation(edge);
  }

  private applyFloatExpandedLayout(edge: DockEdge, anchorRect: ToolbarAnchorRect | null): void {
    if (!this.host || !this.wrapperEl) return;
    const isHorizontal = edge === "left" || edge === "right";
    const centerX = (this.posX / 100) * window.innerWidth;
    const centerY = (this.posY / 100) * window.innerHeight;
    const toolbarW = anchorRect?.width ?? 36;
    const toolbarH = anchorRect?.height ?? 36;
    const toolbarLeft = anchorRect?.left ?? centerX - toolbarW / 2;
    const toolbarRight = anchorRect?.right ?? centerX + toolbarW / 2;
    const toolbarTop = anchorRect?.top ?? centerY - toolbarH / 2;
    const toolbarBottom = anchorRect?.bottom ?? centerY + toolbarH / 2;
    const toolbarCenterX = anchorRect ? toolbarLeft + toolbarW / 2 : centerX;
    const toolbarCenterY = anchorRect ? toolbarTop + toolbarH / 2 : centerY;

    this.wrapperEl.classList.remove("expand-up", "expand-left", "expand-right");
    if (isHorizontal) {
      this.wrapperEl.classList.add(edge === "left" ? "expand-right" : "expand-left");
    } else {
      this.wrapperEl.classList.toggle("expand-up", this.posY > 50);
    }

    this.resetLayoutStyles();
    this.host.style.transition = "none";

    if (isHorizontal) {
      this.host.style.top = `${clampCenterForSize(toolbarCenterY, toolbarH, window.innerHeight)}px`;
      if (edge === "left") {
        const leftX = Math.max(0, toolbarLeft);
        this.host.style.left = `${leftX}px`;
        this.host.style.transform = "translate(0, -50%)";
      } else {
        const rightX = Math.min(window.innerWidth, toolbarRight);
        this.host.style.left = `${rightX}px`;
        this.host.style.transform = "translate(-100%, -50%)";
      }
    } else {
      if (this.posY > 50) {
        const bottomY = Math.min(window.innerHeight, toolbarBottom);
        this.host.style.top = `${bottomY}px`;
        this.host.style.left = `${clampCenterForSize(toolbarCenterX, toolbarW, window.innerWidth)}px`;
        this.host.style.transform = "translate(-50%, -100%)";
      } else {
        const topY = Math.max(0, toolbarTop);
        this.host.style.top = `${topY}px`;
        this.host.style.left = `${clampCenterForSize(toolbarCenterX, toolbarW, window.innerWidth)}px`;
        this.host.style.transform = "translate(-50%, 0)";
      }
    }
    this.applyOrientation(edge);
  }

  private applyEdgeLayout(edge: DockEdge): void {
    if (!this.host || !this.wrapperEl) return;
    this.wrapperEl.classList.add("edge", `edge-${edge}`);
    this.wrapperEl.classList.remove("expand-up", "expand-left", "expand-right");
    this.resetLayoutStyles();

    if (edge === "left" || edge === "right") {
      this.host.style.top = "0";
      this.host.style.bottom = "0";
      this.host.style[edge] = "0";
      this.host.style.transform = "none";
    } else {
      this.host.style.left = "0";
      this.host.style.right = "0";
      this.host.style[edge] = "0";
      this.host.style.transform = "none";
    }
    this.applyOrientation(edge);
  }

  private clearPanelState(): void {
    if (this.recordingShortcutId) this.stopShortcutRecording();

    this.activePanel = null;
    this.wrapperEl?.classList.remove("expanded", "expand-up", "expand-left", "expand-right");
    this.expandBodyEl?.classList.remove("open");
    this.updatePanelButtonStates();
  }

  private restoreFloatPositionFromEdge(edge: DockEdge): void {
    const mx = edgeMarginX();
    if (edge === "left") this.posX = mx;
    else if (edge === "right") this.posX = 100 - mx;
    else if (edge === "top") this.posY = EDGE_MARGIN;
    else this.posY = 100 - EDGE_MARGIN;
  }

  // --- Toolbar Drag ---

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    // Don't drag from expand body content
    const target = e.composedPath()[0] as HTMLElement;
    if (this.expandBodyEl?.contains(target)) return;

    this.isDragging = true;
    this.wasDragged = false;
    this.dragPointerId = e.pointerId;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    const rect = this.toolbarRowEl!.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left - rect.width / 2;
    this.dragOffsetY = e.clientY - rect.top - rect.height / 2;
    this.host!.style.transition = "none";
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (!this.wasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    if (!this.wasDragged) {
      this.wasDragged = true;
      this.toolbarEl!.setPointerCapture(this.dragPointerId);
      this.toolbarEl!.classList.add("dragging");
    }
    this.posX = clamp(((e.clientX - this.dragOffsetX) / window.innerWidth) * 100, 2, 98);
    this.posY = clamp(((e.clientY - this.dragOffsetY) / window.innerHeight) * 100, 2, 98);
    if (this.dockMode === "edge") {
      this.snapToEdge();
    } else if (this.activePanel) {
      this.applyDockLayout();
    } else {
      this.applyPosition();
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.toolbarEl!.releasePointerCapture(e.pointerId);
    this.toolbarEl!.classList.remove("dragging");
    if (this.wasDragged) {
      this.host!.style.transition = SNAP_TRANSITION;
      this.snapToEdge();
      trySavePosition(this.config.storageKey, this.posX, this.posY);
    }
  }

  private snapToEdge(): void {
    const edge = this.getEdgeFromPosition();
    const mx = edgeMarginX();

    if (edge === "right") {
      this.posX = 100 - mx;
    } else if (edge === "bottom") {
      this.posY = 100 - EDGE_MARGIN;
    } else if (edge === "top") {
      this.posY = EDGE_MARGIN;
    } else {
      this.posX = mx;
    }
    this.applyDockLayout();
  }

  private applyPosition(): void {
    if (!this.host) return;
    this.host.style.inset = "";
    this.host.style.left = `${this.posX}%`;
    this.host.style.top = `${this.posY}%`;
  }

  private getEdgeFromPosition(): "top" | "bottom" | "left" | "right" {
    const angle = Math.atan2(this.posY - 50, this.posX - 50);
    const deg = (angle * 180) / Math.PI;
    if (deg >= -45 && deg < 45) return "right";
    if (deg >= 45 && deg < 135) return "bottom";
    if (deg >= -135 && deg < -45) return "top";
    return "left";
  }

  private applyOrientation(edge: "top" | "bottom" | "left" | "right"): void {
    if (!this.toolbarEl) return;
    const wantVertical = edge === "left" || edge === "right";
    this.toolbarEl.classList.toggle("vertical", wantVertical);
  }

  // --- Hotkey recording ---

  private toggleShortcutRecording(id: FloatingButtonShortcutCommandId): void {
    if (this.recordingShortcutId === id) this.stopShortcutRecording();
    else this.startShortcutRecording(id);
  }

  private startShortcutRecording(id: FloatingButtonShortcutCommandId): void {
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
    this.recordingShortcutId = id;
    this.shortcutError = null;
    this.renderExpandBody();

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) return;
      const combo = buildCombo(e);
      const recordedId = this.recordingShortcutId;
      if (!recordedId) return;
      this.recordingShortcutId = null;
      this.boundRecordKeyDown = null;
      this.addShortcut(recordedId, combo);
      document.removeEventListener("keydown", handler, { capture: true });
    };

    this.boundRecordKeyDown = handler;
    document.addEventListener("keydown", handler, { capture: true });
  }

  private stopShortcutRecording(): void {
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
    this.recordingShortcutId = null;
    this.renderExpandBody();
  }
}
