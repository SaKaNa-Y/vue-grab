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
  /** localStorage key for persisting measurer hotkey. Set to "" to disable persistence. */
  measurerHotkeyStorageKey: string;
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
  /** Console capture configuration */
  consoleCapture: ConsoleCaptureConfig;
  /** Network capture configuration */
  networkCapture: NetworkCaptureConfig;
  /** Magnifier loupe configuration */
  magnifier: MagnifierConfig;
  /** Measurer configuration */
  measurer: MeasurerConfig;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U[]
    : T[K] extends readonly (infer U)[]
      ? readonly U[]
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K];
};

export type GrabUserConfig = DeepPartial<GrabConfig>;

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
  /** Recent network activity snapshot, when networkCapture.grabSnapshot.enabled */
  network?: CapturedRequest[];
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

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";
export type LogSource = "console" | "runtime" | "promise" | "vue";

export interface CapturedLog {
  id: number;
  /** Visual severity — determines color + FAB badge eligibility. */
  level: LogLevel;
  /** Where the entry originated. */
  source: LogSource;
  /** Stringified message from args (console) or Error.message (runtime/promise/vue). */
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

export interface ConsoleCaptureConfig {
  /** Enable console capture. Default: true */
  enabled: boolean;
  /** Max entries to keep in ring buffer. Default: 200 */
  maxEntries: number;
  /** Which console.* methods to intercept. Default: all 5 standard levels. */
  levels: readonly LogLevel[];
  /** Capture window error + unhandledrejection (always level: "error"). Default: true */
  captureUnhandled: boolean;
  /** Capture Vue app.config.errorHandler (always level: "error"). Default: true */
  captureVueErrors: boolean;
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

export type NetworkStatusClass = "2xx" | "3xx" | "4xx" | "5xx" | "failed";
export type NetworkInitiator = "fetch" | "xhr";

export interface CapturedRequest {
  id: number;
  /** HTTP method, uppercased (GET/POST/...). */
  method: string;
  /** Request URL as originally supplied. */
  url: string;
  /** Which API produced this entry. */
  initiator: NetworkInitiator;
  /** HTTP status code — undefined until response received; stays undefined on failure. */
  status?: number;
  statusText?: string;
  /** Classification for FAB pills + badge. */
  statusClass: NetworkStatusClass;
  /** performance.now() at request start */
  startTime: number;
  /** Milliseconds; undefined until settled */
  duration?: number;
  /** Redacted request headers */
  requestHeaders?: Record<string, string>;
  /** Truncated request body, if captureBodies */
  requestBody?: string;
  /** Redacted response headers */
  responseHeaders?: Record<string, string>;
  /** Truncated response body — only captured for text/JSON content types */
  responseBody?: string;
  /** Bytes, from Content-Length when available */
  responseSize?: number;
  /** Failure reason (network error, abort, CORS) when no response arrived */
  error?: string;
  /** Date.now() for display */
  timestamp: number;
  /** Dedup count — incremented for repeat occurrences */
  count: number;
  /** Source file extracted from initiator stack */
  sourceFile?: string;
  sourceLine?: number;
}

export interface NetworkGrabSnapshotConfig {
  /** Attach recent network entries to GrabResult.network. Default: true */
  enabled: boolean;
  /** Max entries in the snapshot. Default: 20 */
  maxEntries: number;
  /** Only entries newer than this (ms) are included. Default: 10_000 */
  windowMs: number;
}

export interface NetworkCaptureConfig {
  /** Enable network capture. Default: true */
  enabled: boolean;
  /** Max entries to keep in ring buffer. Default: 100 */
  maxEntries: number;
  /** Intercept window.fetch. Default: true */
  captureFetch: boolean;
  /** Intercept XMLHttpRequest. Default: true */
  captureXhr: boolean;
  /** Capture request + response bodies (subject to size + content-type). Default: false */
  captureBodies: boolean;
  /** Max bytes retained per body. Default: 2048 */
  bodyMaxBytes: number;
  /** Lowercase header names to redact. Default: auth/cookie/set-cookie/x-api-key. */
  redactHeaders: readonly string[];
  /** URL substrings to skip entirely. Default includes vue-grab's own /__open-in-editor. */
  urlDenyList: readonly string[];
  /** Snapshot attached to GrabResult at grab time. */
  grabSnapshot: NetworkGrabSnapshotConfig;
}

export interface MeasurerConfig {
  /** Enable measurer feature. Default: true */
  enabled: boolean;
  /** Color for dimension boxes and measurement lines. Default: "#06b6d4" */
  lineColor: string;
  /** Color for alignment guide lines. Default: "#a855f7" */
  guideColor: string;
  /** Line width in pixels. Default: 1 */
  lineWidth: number;
  /** Show alignment guides when edges/centers align. Default: true */
  showAlignmentGuides: boolean;
  /** Alignment snap tolerance in pixels. Default: 3 */
  alignmentTolerance: number;
}
