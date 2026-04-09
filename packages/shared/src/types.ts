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
  /** Accessibility information for the element */
  a11y: A11yInfo;
}

export interface ComponentInfo {
  /** Component name */
  name: string;
  /** File path if available from Vue devtools */
  filePath?: string;
  /** Line number if available */
  line?: number;
}

export interface A11yAttribute {
  /** Attribute name, e.g. "role", "aria-label", "alt" */
  name: string;
  /** Attribute value */
  value: string;
}

export type A11ySeverity = "warning" | "info";

export interface A11yAuditItem {
  severity: A11ySeverity;
  message: string;
}

export interface A11yInfo {
  /** Detected a11y attributes present on the element. */
  attributes: A11yAttribute[];
  /** Audit findings: missing recommended attributes or issues. */
  audit: A11yAuditItem[];
  /** True when at least one meaningful a11y attribute is present. */
  hasA11y: boolean;
}

export interface ElementA11yDetail {
  element: Element;
  tagName: string;
  selector: string;
  a11y: A11yInfo;
}

export interface ComponentA11ySummary {
  componentName: string;
  filePath?: string;
  element: Element;
  a11y: A11yInfo;
  childElements: ElementA11yDetail[];
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
