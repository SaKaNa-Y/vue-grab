export interface GrabConfig {
  /** Highlight border color */
  highlightColor: string
  /** Label text color */
  labelTextColor: string
  /** Show floating tag hint on hover */
  showTagHint: boolean
  /** Filter options for element selection */
  filter: GrabFilterConfig
}

export interface GrabFilterConfig {
  /** CSS selectors to ignore */
  ignoreSelectors: string[]
  /** HTML tags to ignore */
  ignoreTags: string[]
  /** Skip common layout components (header, nav, footer, aside) */
  skipCommonComponents: boolean
}

export interface GrabResult {
  /** The selected DOM element */
  element: Element
  /** HTML source of the element */
  html: string
  /** Vue component hierarchy leading to this element */
  componentStack: ComponentInfo[]
  /** CSS selector for the element */
  selector: string
}

export interface ComponentInfo {
  /** Component name */
  name: string
  /** File path if available from Vue devtools */
  filePath?: string
  /** Line number if available */
  line?: number
}
