import type {
  CapturedLog,
  CapturedRequest,
  FloatingButtonConfig,
  GrabResult,
  LogLevel,
  NetworkStatusClass,
} from "@sakana-y/vue-grab-shared";
import {
  ALL_LOG_LEVELS,
  ALL_NETWORK_STATUS_CLASSES,
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
} from "../utils";
import { openInClaudeCode } from "../editor";

export const FAB_HOST_ID = "vue-grab-fab-host";

const DRAG_THRESHOLD = 3;
const SNAP_TRANSITION = "left 0.3s ease, top 0.3s ease";
const EDGE_MARGIN = 3; // reference margin as % of viewport height
const INITIAL_SNAP_ZONE = 5; // positions within this % of edge get adjusted to responsive margin

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

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
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

function tryReadHotkey(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

function trySaveHotkey(key: string, combo: string): void {
  trySaveStorage(key, combo);
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

type TabId = "shortcuts" | "editor" | "magnifier";
type PanelId = "settings" | "accessibility" | "logs" | "network";

const STYLES = `
  :host {
    all: initial;
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
    background: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
  }
  .gear-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
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
  .a11y-panel { padding: 12px 14px; }
  .a11y-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .a11y-title {
    font-size: 13px;
    font-weight: 600;
    color: #e0e0e0;
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
  .a11y-summary {
    font-size: 12px;
    color: #888;
    margin-bottom: 12px;
    padding: 6px 10px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
  }
  .a11y-summary-pass { color: #4ade80; font-weight: 600; }
  .a11y-summary-fail { color: #ffcb6b; font-weight: 600; }
  .a11y-group-title {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 10px 0 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .a11y-group-count {
    font-size: 10px;
    background: rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 1px 6px;
    color: #aaa;
  }
  .a11y-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 2px;
    transition: background 0.1s ease;
    cursor: default;
  }
  .a11y-row:hover {
    background: rgba(255,255,255,0.04);
  }
  .a11y-row-icon {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    padding-top: 1px;
  }
  .a11y-row-icon.pass { color: #4ade80; }
  .a11y-row-icon.fail { color: #ffcb6b; }
  .a11y-row-icon.neutral { color: #555; }
  .a11y-row-body { flex: 1; min-width: 0; }
  .a11y-row-name {
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #7dd3fc;
  }
  .a11y-row-file {
    font-size: 11px;
    color: #666;
    word-break: break-all;
    margin-top: 1px;
  }
  .a11y-row-detail {
    font-size: 11px;
    color: #999;
    margin-top: 2px;
  }
  .a11y-row-detail.warning { color: #ffcb6b; }
  .a11y-empty {
    color: #555;
    text-align: center;
    padding: 20px;
    font-size: 12px;
  }
  .a11y-rescan-btn--loading {
    opacity: 0.6;
    pointer-events: none;
  }
  .a11y-row-toggle {
    cursor: pointer;
  }
  .a11y-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: #666;
    margin-right: 2px;
  }
  .a11y-row-chevron.open {
    transform: rotate(90deg);
  }
  .a11y-row-count {
    font-size: 10px;
    background: rgba(255,203,107,0.15);
    color: #ffcb6b;
    border-radius: 8px;
    padding: 0 5px;
    margin-left: 6px;
  }
  .a11y-child-details {
    display: none;
    padding-left: 24px;
    padding-bottom: 4px;
  }
  .a11y-child-details.open {
    display: block;
  }
  .a11y-child-row {
    font-size: 11px;
    padding: 4px 8px;
    border-left: 2px solid rgba(255,255,255,0.08);
    margin: 2px 0;
    border-radius: 0 4px 4px 0;
  }
  .a11y-child-row:hover {
    background: rgba(255,255,255,0.03);
  }
  .a11y-child-tag {
    color: #c792ea;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
  }
  .a11y-child-msg {
    font-size: 11px;
    margin-top: 1px;
  }
  .a11y-child-msg.warning { color: #ffcb6b; }
  .a11y-child-msg.pass { color: #4ade80; }
  .a11y-child-msg.neutral { color: #666; font-style: italic; }

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

  /* Slider row */
  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .slider-row input[type="range"] {
    flex: 1;
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
    min-width: 38px;
    text-align: right;
    font-variant-numeric: tabular-nums;
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

  /* Hotkey row */
  .hotkey-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  kbd {
    display: inline-flex;
    align-items: center;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
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
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 4px 10px;
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
    padding: 6px 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
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
    width: 100%;
    margin-top: 12px;
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
    margin-top: 8px;
    font-size: 11px;
    color: #666;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  .fab-wrapper.expanded:not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.expanded:not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  /* ── Console (logs) panel ── */
  .logs-panel { padding: 12px 14px; min-width: 340px; }
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
  .logs-filter-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
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
  .log-row-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
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
  .log-row-source {
    font-size: 9px;
    color: #888;
    padding: 1px 4px;
    border-radius: 3px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    text-transform: lowercase;
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
  .log-row-count {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: var(--c);
    border-radius: 8px;
    padding: 0 5px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .log-row-time {
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .log-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
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
  .log-row-vue-info {
    font-size: 11px;
    color: #c792ea;
    margin-bottom: 6px;
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
  .logs-empty {
    color: #555;
    text-align: center;
    padding: 20px;
    font-size: 12px;
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
  private cachedA11yResults: ReturnType<typeof scanPageA11y> | null = null;
  private lastA11yScanTime = 0;
  private pendingRafId: number | null = null;
  private logsRenderRafId: number | null = null;
  private config: FloatingButtonConfig;

  // Expand state
  private activePanel: PanelId | null = null;
  private settingsTab: TabId = "shortcuts";
  private isGrabActive = false;
  private isMagnifierActive = false;
  private isMeasurerActive = false;

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

  // Hotkey state
  private isRecording = false;
  private currentHotkey = "";
  private isRecordingMeasurer = false;
  private currentMeasurerHotkey = "";

  // Callbacks
  private toggleCb: (() => void) | null = null;
  private hotkeyChangeCb: ((combo: string) => void) | null = null;
  private configChangeCb: ((changes: Record<string, unknown>) => void) | null = null;
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
    this.currentHotkey = tryReadHotkey(config.hotkeyStorageKey) ?? "";
    this.currentMeasurerHotkey = tryReadHotkey(config.measurerHotkeyStorageKey) ?? "";
    this.editorChoice = tryReadEditor(config.editorStorageKey) ?? "";
  }

  getCurrentHotkey(): string {
    return this.currentHotkey;
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

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = FAB_HOST_ID;
    this.host.style.cssText = `position:fixed;z-index:2147483646;pointer-events:auto;transform:translate(-50%,-50%);transition:${SNAP_TRANSITION};`;
    this.applyPosition();
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

    // Main grab button
    this.btnEl = document.createElement("div");
    this.btnEl.className = "toolbar-btn grab-btn";
    this.btnEl.innerHTML = CROSSHAIR_SVG;
    this.toolbarRowEl.appendChild(this.btnEl);

    // Divider
    const divider1 = document.createElement("div");
    divider1.className = "toolbar-divider";
    this.toolbarRowEl.appendChild(divider1);

    // Gear button (settings)
    this.gearEl = document.createElement("div");
    this.gearEl.className = "toolbar-btn gear-btn";
    this.gearEl.innerHTML = GEAR_SVG;
    this.toolbarRowEl.appendChild(this.gearEl);

    // Magnifier button
    this.magnifierBtnEl = document.createElement("div");
    this.magnifierBtnEl.className = "toolbar-btn magnifier-btn";
    this.magnifierBtnEl.innerHTML = MAGNIFIER_SVG;
    this.magnifierBtnEl.title = "Magnifier loupe";
    this.toolbarRowEl.appendChild(this.magnifierBtnEl);

    // Measurer button
    this.measurerBtnEl = document.createElement("div");
    this.measurerBtnEl.className = "toolbar-btn measurer-btn";
    this.measurerBtnEl.innerHTML = MEASURER_SVG;
    this.measurerBtnEl.title = "Measure spacing";
    this.toolbarRowEl.appendChild(this.measurerBtnEl);

    // Divider before a11y
    const divider2 = document.createElement("div");
    divider2.className = "toolbar-divider";
    this.toolbarRowEl.appendChild(divider2);

    // A11y button
    this.a11yIndicatorEl = document.createElement("div");
    this.a11yIndicatorEl.className = "toolbar-btn a11y-btn";
    this.a11yIndicatorEl.innerHTML = A11Y_ICON_SVG;
    this.toolbarRowEl.appendChild(this.a11yIndicatorEl);

    // Divider before errors
    const divider3 = document.createElement("div");
    divider3.className = "toolbar-divider";
    this.toolbarRowEl.appendChild(divider3);

    this.logsBtnEl = document.createElement("div");
    this.logsBtnEl.className = "toolbar-btn logs-btn";
    this.logsBtnEl.innerHTML = LOGS_SVG;
    this.logsBtnEl.title = "Console logs";
    this.logsBadgeEl = document.createElement("span");
    this.logsBadgeEl.className = "logs-badge";
    this.logsBadgeEl.style.display = "none";
    this.logsBtnEl.appendChild(this.logsBadgeEl);
    this.toolbarRowEl.appendChild(this.logsBtnEl);

    this.networkBtnEl = document.createElement("div");
    this.networkBtnEl.className = "toolbar-btn network-btn";
    this.networkBtnEl.innerHTML = NETWORK_SVG;
    this.networkBtnEl.title = "Network requests";
    this.networkBadgeEl = document.createElement("span");
    this.networkBadgeEl.className = "network-badge";
    this.networkBadgeEl.style.display = "none";
    this.networkBtnEl.appendChild(this.networkBadgeEl);
    this.toolbarRowEl.appendChild(this.networkBtnEl);

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

    // Set initial orientation based on position
    this.applyOrientation(this.getEdgeFromPosition());

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
      const path = e.composedPath();
      if (!path.includes(this.host!)) {
        this.deactivatePanel();
      }
    };
    document.addEventListener("click", this.boundDocClick, { capture: true });

    // Document: Escape closes panel or stops recording
    this.boundDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (this.isRecording) {
          this.stopRecording();
          e.preventDefault();
          e.stopPropagation();
        } else if (this.isRecordingMeasurer) {
          this.stopMeasurerRecording();
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
    this.currentHotkey = combo;
    // Update display if settings panel is showing
    if (this.activePanel === "settings") {
      const kbd = this.expandBodyEl?.querySelector(".grab-hotkey-kbd");
      if (kbd) kbd.textContent = combo || "None";
    }
  }

  onToggle(cb: () => void): void {
    this.toggleCb = cb;
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.hotkeyChangeCb = cb;
  }

  onConfigChange(cb: (changes: Record<string, unknown>) => void): void {
    this.configChangeCb = cb;
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
    return this.currentMeasurerHotkey;
  }

  onMeasurerHotkeyChange(cb: (combo: string) => void): void {
    this.measurerHotkeyChangeCb = cb;
  }

  setCurrentMeasurerHotkey(combo: string): void {
    this.currentMeasurerHotkey = combo;
    if (this.activePanel === "settings") {
      const kbd = this.expandBodyEl?.querySelector(".measurer-hotkey-kbd");
      if (kbd) kbd.textContent = combo || "None";
    }
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
    // Stop recording if switching away from settings
    if (this.isRecording) this.stopRecording();
    if (this.isRecordingMeasurer) this.stopMeasurerRecording();

    this.activePanel = panel;
    this.wrapperEl!.classList.add("expanded");

    const edge = this.getEdgeFromPosition();
    const isHorizontal = edge === "left" || edge === "right";

    // Remove all expand direction classes first
    this.wrapperEl!.classList.remove("expand-up", "expand-left", "expand-right");

    if (isHorizontal) {
      // Left edge → panel expands right; Right edge → panel expands left
      this.wrapperEl!.classList.add(edge === "left" ? "expand-right" : "expand-left");
    } else {
      const expandUp = this.posY > 50;
      this.wrapperEl!.classList.toggle("expand-up", expandUp);
    }

    this.expandBodyEl!.classList.add("open");
    this.renderExpandBody();

    // Anchor the host so the toolbar stays in place while the panel expands
    if (this.host) {
      this.host.style.transition = "none";

      if (isHorizontal) {
        const toolbarW = this.toolbarEl?.getBoundingClientRect().width ?? 36;
        const centerX = (this.posX / 100) * window.innerWidth;
        const centerY = (this.posY / 100) * window.innerHeight;
        this.host.style.top = `${centerY}px`;
        if (edge === "left") {
          const leftX = centerX - toolbarW / 2;
          this.host.style.left = `${leftX}px`;
          this.host.style.transform = "translate(0, -50%)";
        } else {
          const rightX = centerX + toolbarW / 2;
          this.host.style.left = `${rightX}px`;
          this.host.style.transform = "translate(-100%, -50%)";
        }
      } else {
        const toolbarH = 36;
        const centerY = (this.posY / 100) * window.innerHeight;
        if (this.posY > 50) {
          const bottomY = centerY + toolbarH / 2;
          this.host.style.top = `${bottomY}px`;
          this.host.style.transform = "translate(-50%, -100%)";
        } else {
          const topY = centerY - toolbarH / 2;
          this.host.style.top = `${topY}px`;
          this.host.style.transform = "translate(-50%, 0)";
        }
      }
    }

    // Update icon highlights
    this.gearEl!.classList.toggle("active", panel === "settings");
    this.a11yIndicatorEl!.classList.toggle("active", panel === "accessibility");
    this.logsBtnEl!.classList.toggle("active", panel === "logs");
    this.networkBtnEl!.classList.toggle("active", panel === "network");
  }

  private deactivatePanel(): void {
    if (!this.activePanel) return;
    if (this.isRecording) this.stopRecording();
    if (this.isRecordingMeasurer) this.stopMeasurerRecording();

    this.activePanel = null;
    this.wrapperEl!.classList.remove("expanded", "expand-up", "expand-left", "expand-right");
    this.expandBodyEl!.classList.remove("open");
    this.gearEl!.classList.remove("active");
    this.a11yIndicatorEl!.classList.remove("active");
    this.logsBtnEl!.classList.remove("active");
    this.networkBtnEl!.classList.remove("active");

    if (this.host) {
      this.host.style.transition = "none";
      this.host.style.transform = "translate(-50%, -50%)";
      this.applyPosition();
      this.pendingRafId = requestAnimationFrame(() => {
        this.pendingRafId = null;
        if (this.host) this.host.style.transition = SNAP_TRANSITION;
      });
    }

    // Re-apply vertical orientation if needed
    this.applyOrientation(this.getEdgeFromPosition());
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

    const comp = this.lastGrabResult?.componentStack[0];
    const filePathText = comp?.filePath ?? "No element grabbed yet";
    const fileDisabled = !comp?.filePath;

    return `
      <div class="tab-bar">
        <button class="tab-btn${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab="shortcuts">Shortcuts</button>
        <button class="tab-btn${this.settingsTab === "editor" ? " active" : ""}" data-tab="editor">Editor</button>
        <button class="tab-btn${this.settingsTab === "magnifier" ? " active" : ""}" data-tab="magnifier">Magnifier</button>
      </div>
      <div class="tab-content${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab-content="shortcuts">
        <div class="section-label">Grab Hotkey</div>
        <div class="hotkey-row">
          <kbd class="grab-hotkey-kbd">${esc(this.currentHotkey || "None")}</kbd>
          <button class="record-btn grab-record-btn">Record</button>
        </div>
        <div class="section-label">Measurer Hotkey</div>
        <div class="hotkey-row">
          <kbd class="measurer-hotkey-kbd">${esc(this.currentMeasurerHotkey || "None")}</kbd>
          <button class="record-btn measurer-record-btn">Record</button>
        </div>
      </div>
      <div class="tab-content${this.settingsTab === "editor" ? " active" : ""}" data-tab-content="editor">
        <div class="section-label">Editor</div>
        <select class="editor-select">${editorOptions}</select>
        <div class="section-label">Open file</div>
        <div class="file-path-display">${esc(filePathText)}</div>
        <button class="open-file-btn"${fileDisabled ? " disabled" : ""}>Open in Editor</button>
      </div>
      <div class="tab-content${this.settingsTab === "magnifier" ? " active" : ""}" data-tab-content="magnifier">
        <div class="section-label">Loupe Size</div>
        <div class="slider-row">
          <input type="range" class="magnifier-size-slider" min="100" max="600" step="50" value="${this.magnifierLoupeSize}">
          <span class="slider-value">${this.magnifierLoupeSize}px</span>
        </div>
        <div class="section-label">Zoom Level</div>
        <div class="slider-row">
          <input type="range" class="magnifier-zoom-slider" min="1" max="8" step="0.5" value="${this.magnifierZoomLevel}">
          <span class="slider-value">${this.magnifierZoomLevel}x</span>
        </div>
      </div>
    `;
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

    // Record buttons
    const grabRecordBtn = this.expandBodyEl.querySelector(".grab-record-btn");
    grabRecordBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.toggleRecording();
    });

    const measurerRecordBtn = this.expandBodyEl.querySelector(".measurer-record-btn");
    measurerRecordBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.toggleMeasurerRecording();
    });

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

  private updateEditorTabInPlace(): void {
    if (!this.expandBodyEl || this.activePanel !== "settings") return;
    const filePathEl = this.expandBodyEl.querySelector(".file-path-display");
    const openBtn = this.expandBodyEl.querySelector<HTMLButtonElement>(".open-file-btn");
    if (!filePathEl || !openBtn) return;

    const comp = this.lastGrabResult?.componentStack[0];
    if (comp?.filePath) {
      filePathEl.textContent = comp.filePath;
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

    // Summary
    const passCount = passing.length;
    const issueCount = issues.length;
    html += '<div class="a11y-summary">';
    html += `<span class="a11y-summary-pass">${passCount}</span> passing`;
    if (issueCount > 0) {
      html += ` · <span class="a11y-summary-fail">${issueCount}</span> with issues`;
    }
    if (neutral.length > 0) {
      html += ` · ${neutral.length} no a11y attrs`;
    }
    html += ` · ${results.length} total`;
    html += "</div>";

    // Issues section
    let idx = 0;
    if (issues.length > 0) {
      html +=
        '<div class="a11y-group-title">\u26A0 Issues <span class="a11y-group-count">' +
        issues.length +
        "</span></div>";
      for (const item of issues) {
        html += this.renderA11yRow(item, "fail", idx++);
      }
    }

    // Neutral (no a11y)
    if (neutral.length > 0) {
      html +=
        '<div class="a11y-group-title">\u2014 No accessibility <span class="a11y-group-count">' +
        neutral.length +
        "</span></div>";
      for (const item of neutral) {
        html += this.renderA11yRow(item, "neutral", idx++);
      }
    }

    // Passing section
    if (passing.length > 0) {
      html +=
        '<div class="a11y-group-title">\u2713 Passing <span class="a11y-group-count">' +
        passing.length +
        "</span></div>";
      for (const item of passing) {
        html += this.renderA11yRow(item, "pass", idx++);
      }
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
    const hasChildren = item.childElements.length > 0;
    const wrapClass = hasChildren ? "a11y-row-toggle" : "";
    const dataAttr = hasChildren ? ` data-a11y-idx="${idx}"` : "";

    let html = `<div class="${wrapClass}"${dataAttr}>`;
    html += '<div class="a11y-row">';
    html += `<div class="a11y-row-icon ${status}">${icon}</div>`;
    html += '<div class="a11y-row-body">';

    // Component name with optional chevron and count
    html += '<div class="a11y-row-name">';
    if (hasChildren) {
      html += '<span class="a11y-row-chevron">\u25B6</span> ';
    }
    html += `&lt;${esc(item.componentName)}&gt;`;
    if (hasChildren) {
      html += `<span class="a11y-row-count">${item.childElements.length}</span>`;
    }
    html += "</div>";

    if (item.filePath) {
      html += `<div class="a11y-row-file">${esc(item.filePath)}</div>`;
    }

    // Show attributes if passing
    if (status === "pass" && item.a11y.attributes.length > 0) {
      const attrNames = item.a11y.attributes.map((a) => a.name).join(", ");
      html += `<div class="a11y-row-detail">${esc(attrNames)}</div>`;
    }

    html += "</div></div>";

    // Child element details (hidden by default)
    if (hasChildren) {
      html += `<div class="a11y-child-details" data-a11y-details="${idx}">`;
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
    }

    html += "</div>";
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
      setTimeout(() => {
        if (!this.expandBodyEl || this.activePanel !== "accessibility") return;
        this.expandBodyEl.innerHTML = this.renderA11yPanelContent(true);
        this.wireA11yPanelEvents();
      }, 0);
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
    const pills = ALL_LOG_LEVELS.map((lvl) => {
      const active = this.filterLevels.has(lvl);
      return `<button class="logs-pill${active ? " active" : ""}" data-level="${lvl}" type="button">${lvl}<span class="count">${counts[lvl]}</span></button>`;
    }).join("");

    let html = '<div class="logs-panel">';
    html += '<div class="logs-header">';
    html += '<span class="logs-title">Console</span>';
    html += '<button class="logs-clear-btn" type="button">Clear</button>';
    html += "</div>";
    html += `<div class="logs-filter-bar">${pills}</div>`;
    html += `<input class="logs-search" type="text" placeholder="Filter messages…" value="${esc(this.searchTerm)}">`;

    if (visible.length === 0) {
      const empty =
        this.logEntries.length === 0 ? "No logs captured" : "No logs match the current filter";
      html += `<div class="logs-empty">${empty}</div></div>`;
      return html;
    }

    for (let i = 0; i < visible.length; i++) {
      const log = visible[i];
      const time = new Date(log.timestamp).toLocaleTimeString();
      const msgTrunc = truncate(log.message, 120);

      html += `<div class="log-row" data-level="${log.level}" data-log-idx="${i}">`;
      html += '<div class="log-row-header">';
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
      html += "</div>";

      html += `<div class="log-row-details" data-log-details="${i}">`;
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
    }

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
    this.applyPosition();
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
    this.applyPosition();
    this.applyOrientation(edge);
  }

  private applyPosition(): void {
    if (!this.host) return;
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

  private toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.isRecording = true;
    this.boundRecordKeyDown = this.startRecordingFor(
      ".grab-hotkey-kbd",
      ".grab-record-btn",
      this.config.hotkeyStorageKey,
      (combo) => {
        this.currentHotkey = combo;
        this.stopRecording();
        this.hotkeyChangeCb?.(combo);
      },
    );
  }

  private stopRecording(): void {
    this.isRecording = false;
    this.boundRecordKeyDown = this.stopRecordingFor(
      this.boundRecordKeyDown,
      ".grab-hotkey-kbd",
      ".grab-record-btn",
      this.currentHotkey,
    );
  }

  private toggleMeasurerRecording(): void {
    if (this.isRecordingMeasurer) {
      this.stopMeasurerRecording();
    } else {
      this.startMeasurerRecording();
    }
  }

  private startMeasurerRecording(): void {
    this.isRecordingMeasurer = true;
    this.boundRecordKeyDown = this.startRecordingFor(
      ".measurer-hotkey-kbd",
      ".measurer-record-btn",
      this.config.measurerHotkeyStorageKey,
      (combo) => {
        this.currentMeasurerHotkey = combo;
        this.stopMeasurerRecording();
        this.measurerHotkeyChangeCb?.(combo);
      },
    );
  }

  private stopMeasurerRecording(): void {
    this.isRecordingMeasurer = false;
    this.boundRecordKeyDown = this.stopRecordingFor(
      this.boundRecordKeyDown,
      ".measurer-hotkey-kbd",
      ".measurer-record-btn",
      this.currentMeasurerHotkey,
    );
  }

  /** Shared: begin recording a hotkey, returns the bound keydown handler */
  private startRecordingFor(
    kbdSelector: string,
    btnSelector: string,
    storageKey: string,
    onRecord: (combo: string) => void,
  ): (e: KeyboardEvent) => void {
    const kbdEl = this.expandBodyEl?.querySelector(kbdSelector);
    const recordBtn = this.expandBodyEl?.querySelector(btnSelector);
    if (kbdEl) {
      kbdEl.textContent = "Press keys\u2026";
      kbdEl.classList.add("recording");
    }
    if (recordBtn) recordBtn.textContent = "Cancel";

    // Remove previous handler if any
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
    }

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) return;
      const combo = buildCombo(e);
      trySaveHotkey(storageKey, combo);
      onRecord(combo);
    };

    document.addEventListener("keydown", handler, { capture: true });
    return handler;
  }

  /** Shared: stop recording, returns null to clear the bound handler */
  private stopRecordingFor(
    handler: ((e: KeyboardEvent) => void) | null,
    kbdSelector: string,
    btnSelector: string,
    currentValue: string,
  ): null {
    if (handler) {
      document.removeEventListener("keydown", handler, { capture: true });
    }
    const kbdEl = this.expandBodyEl?.querySelector(kbdSelector);
    const recordBtn = this.expandBodyEl?.querySelector(btnSelector);
    if (kbdEl) {
      kbdEl.textContent = currentValue || "None";
      kbdEl.classList.remove("recording");
    }
    if (recordBtn) recordBtn.textContent = "Record";
    return null;
  }
}
