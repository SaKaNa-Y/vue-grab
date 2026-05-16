import type { FloatingButtonDockEntryId, FloatingButtonDockMode } from "@sakana-y/vue-grab-shared";
import { DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER } from "@sakana-y/vue-grab-shared";
import type {
  DockEntryDefinition,
  DockEntryGroupDefinition,
  ShortcutCommandDefinition,
} from "./types";
import {
  A11Y_ICON_SVG,
  CROSSHAIR_SVG,
  GEAR_SVG,
  LOGS_SVG,
  MAGNIFIER_SVG,
  MEASURER_SVG,
  NETWORK_SVG,
  RENDER_SCAN_SVG,
} from "./icons";

export const EDITOR_PRESETS = [
  { label: "Auto-detect", value: "" },
  { label: "VS Code", value: "code" },
  { label: "Cursor", value: "cursor" },
];

export const DOCK_MODE_OPTIONS: readonly {
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

export const DOCK_ENTRY_GROUPS: readonly DockEntryGroupDefinition[] = [
  { id: "capture", label: "Capture" },
  { id: "inspection", label: "Inspection" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "system", label: "System" },
];

const BETA_BADGE = "Beta";

export const DOCK_ENTRY_DEFINITIONS: readonly DockEntryDefinition[] = [
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
    id: "render-scan",
    label: "Render Scan",
    title: "Render update heatmap",
    group: "diagnostics",
    buttonClass: "render-scan-btn",
    icon: RENDER_SCAN_SVG,
    badge: BETA_BADGE,
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

export const SHORTCUT_COMMAND_DEFINITIONS: readonly ShortcutCommandDefinition[] = [
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
    id: "render-scan",
    label: "Render Scan",
    description: "Toggle the Vue component update heatmap.",
    icon: RENDER_SCAN_SVG,
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

export const DOCK_ENTRY_IDS = new Set<FloatingButtonDockEntryId>(
  DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
);

export const DOCK_ENTRY_DEFINITION_BY_ID = new Map(
  DOCK_ENTRY_DEFINITIONS.map((entry) => [entry.id, entry]),
);

export function isDockEntryId(value: unknown): value is FloatingButtonDockEntryId {
  return typeof value === "string" && DOCK_ENTRY_IDS.has(value as FloatingButtonDockEntryId);
}
