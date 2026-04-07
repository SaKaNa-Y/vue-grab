export interface FloatingButtonConfig {
  /** Show the floating button. Default: false (opt-in). */
  enabled: boolean;
  /** Initial position before any localStorage override. */
  initialPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "top-center";
  /** localStorage key for persisting position. Set to "" to disable persistence. */
  storageKey: string;
  /** localStorage key for persisting hotkey. Set to "" to disable persistence. */
  hotkeyStorageKey: string;
  /** localStorage key for persisting editor choice. Set to "" to disable persistence. */
  editorStorageKey: string;
}

export interface GrabConfig {
  /** Highlight border color */
  highlightColor: string;
  /** Label text color */
  labelTextColor: string;
  /** Show floating tag hint on hover */
  showTagHint: boolean;
  /** Maximum length of captured outerHTML (0 = unlimited) */
  maxHtmlLength: number;
  /** Filter options for element selection */
  filter: GrabFilterConfig;
  /** Floating button configuration */
  floatingButton: FloatingButtonConfig;
  /** DevTools inspector panel configuration */
  devtoolsPanel: DevToolsPanelConfig;
}

export interface GrabFilterConfig {
  /** CSS selectors to ignore */
  ignoreSelectors: string[];
  /** HTML tags to ignore */
  ignoreTags: string[];
  /** Skip common layout components (header, nav, footer, aside) */
  skipCommonComponents: boolean;
}

export interface GrabResult {
  /** The selected DOM element */
  element: Element;
  /** HTML source of the element */
  html: string;
  /** Vue component hierarchy leading to this element */
  componentStack: ComponentInfo[];
  /** CSS selector for the element */
  selector: string;
}

export interface ComponentInfo {
  /** Component name */
  name: string;
  /** File path if available from Vue devtools */
  filePath?: string;
  /** Line number if available */
  line?: number;
}

export type DevToolsPanelMode = "float" | "edge";
export type EdgeDockSide = "bottom" | "right";

export interface DevToolsPanelConfig {
  enabled: boolean;
  initialMode: DevToolsPanelMode;
  edgeSide: EdgeDockSide;
  panelModeStorageKey: string;
  panelGeometryStorageKey: string;
}

export interface MatchedCSSRule {
  selectorText: string;
  originalSelectorText: string;
  sourceFile: string | null;
  styleIndex: number;
  properties: CSSPropertyEntry[];
  editable: boolean;
}

export interface CSSPropertyEntry {
  property: string;
  value: string;
  priority: string;
}

export interface StyleUpdateRequest {
  file: string;
  selector: string;
  property: string;
  value: string;
  styleIndex: number;
}
