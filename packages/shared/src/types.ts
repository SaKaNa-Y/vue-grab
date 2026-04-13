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
  /** Error capture configuration */
  errorCapture: ErrorCaptureConfig;
  /** Magnifier loupe configuration */
  magnifier: MagnifierConfig;
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

export type CapturedErrorType = "console.error" | "runtime" | "promise" | "vue";

export interface CapturedError {
  id: number;
  type: CapturedErrorType;
  message: string;
  stack?: string;
  /** Vue lifecycle info string from app.config.errorHandler */
  vueInfo?: string;
  /** Component stack at time of capture (if available from last grab) */
  componentStack?: ComponentInfo[];
  /** Source file if extractable from stack trace */
  sourceFile?: string;
  /** Source line if extractable */
  sourceLine?: number;
  timestamp: number;
  /** Dedup count — incremented for repeat occurrences */
  count: number;
}

export interface ErrorCaptureConfig {
  /** Enable error capture. Default: true */
  enabled: boolean;
  /** Max errors to keep in ring buffer. Default: 50 */
  maxErrors: number;
  /** Capture console.error calls. Default: true */
  captureConsoleError: boolean;
  /** Capture window error + unhandledrejection. Default: true */
  captureUnhandled: boolean;
  /** Capture Vue app.config.errorHandler. Default: true */
  captureVueErrors: boolean;
}

export interface DevToolsPanelConfig {
  enabled: boolean;
  initialMode: DevToolsPanelMode;
  edgeSide: EdgeDockSide;
  panelModeStorageKey: string;
  panelGeometryStorageKey: string;
}

export interface MagnifierConfig {
  /** Enable magnifier feature. Default: true */
  enabled: boolean;
  /** Diameter of the loupe circle in pixels. Default: 200 */
  loupeSize: number;
  /** Zoom level (multiplier). Default: 3 */
  zoomLevel: number;
  /** Show HTML source overlay inside the loupe. Default: true */
  showHtmlOverlay: boolean;
  /** Maximum characters of HTML to show in overlay. Default: 200 */
  maxOverlayHtmlLength: number;
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
