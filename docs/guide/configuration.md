# Configuration

All configuration is optional. Pass a nested partial `GrabConfig` to `createVueGrab()` or `init()`; it is deep-merged with `DEFAULT_CONFIG` via `mergeConfig()` from `@sakana-y/vue-grab-shared`.

```ts
import { createVueGrab } from "@sakana-y/vue-grab";

createVueGrab({
  highlightColor: "#4f46e5",
  maxHtmlLength: 5000,
  floatingButton: { enabled: true },
  consoleCapture: { maxEntries: 500 },
  networkCapture: { captureBodies: false },
  filter: { ignoreTags: ["script", "style"] },
});
```

## Top-level options

| Field            | Type                   | Default     | Description                                    |
| ---------------- | ---------------------- | ----------- | ---------------------------------------------- |
| `highlightColor` | `string`               | `"#4f46e5"` | Overlay border and label background.           |
| `labelTextColor` | `string`               | `"#ffffff"` | Label text color.                              |
| `showTagHint`    | `boolean`              | `true`      | Show the tag-name pill in the overlay label.   |
| `maxHtmlLength`  | `number`               | `10_000`    | Truncate captured outerHTML at this length.    |
| `filter`         | `GrabFilterConfig`     | see below   | What the engine skips while hovering.          |
| `floatingButton` | `FloatingButtonConfig` | disabled    | Optional toolbar with panels and settings.     |
| `consoleCapture` | `ConsoleCaptureConfig` | enabled     | Ring-buffered console + runtime error capture. |
| `networkCapture` | `NetworkCaptureConfig` | enabled     | Ring-buffered fetch/XHR metadata capture.      |
| `magnifier`      | `MagnifierConfig`      | enabled     | Loupe overlay that appears while grabbing.     |
| `measurer`       | `MeasurerConfig`       | enabled     | Element-to-element spacing inspector.          |

## `filter`

| Field                  | Type       | Default | Description                                        |
| ---------------------- | ---------- | ------- | -------------------------------------------------- |
| `ignoreSelectors`      | `string[]` | `[]`    | CSS selectors the engine will refuse to highlight. |
| `ignoreTags`           | `string[]` | `[]`    | Tag names the engine will refuse to highlight.     |
| `skipCommonComponents` | `boolean`  | `false` | Skip common layout tags such as header/nav/footer. |

## `floatingButton`

| Field                           | Type                                                                           | Default                             | Description                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| `enabled`                       | `boolean`                                                                      | `false`                             | Render the floating button. Off by default so you can opt in.        |
| `initialPosition`               | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left" \| "top-center"` | `"top-center"`                      | Starting position before any persisted position is restored.         |
| `dockMode`                      | `"float" \| "edge"`                                                            | `"float"`                           | Display mode for panels: draggable floating panel or full-edge rail. |
| `dockEntries`                   | `FloatingButtonDockEntriesConfig`                                              | all entries visible                 | Toolbar entry order and hidden entries. Settings is always visible.  |
| `storageKey`                    | `string`                                                                       | `"vue-grab-fab-pos"`                | localStorage key for persisted position. Set `""` to disable.        |
| `dockModeStorageKey`            | `string`                                                                       | `"vue-grab-dock-mode"`              | localStorage key for the dock mode preference. Set `""` to disable.  |
| `dockEntriesStorageKey`         | `string`                                                                       | `"vue-grab-dock-entries"`           | localStorage key for toolbar entry visibility/order.                 |
| `hotkeyStorageKey`              | `string`                                                                       | `"vue-grab-hotkey"`                 | localStorage key for the user-customized grab hotkey.                |
| `editorStorageKey`              | `string`                                                                       | `"vue-grab-editor"`                 | localStorage key for the user-preferred editor command.              |
| `measurerHotkeyStorageKey`      | `string`                                                                       | `"vue-grab-measurer-hotkey"`        | localStorage key for the measurer hotkey.                            |
| `closeOnOutsideClick`           | `boolean`                                                                      | `true`                              | Close the active floating button panel when clicking outside it.     |
| `closeOnOutsideClickStorageKey` | `string`                                                                       | `"vue-grab-close-on-outside-click"` | localStorage key for outside-click close behavior.                   |

### `floatingButton.dockEntries`

`order` accepts toolbar entry ids: `"grab"`, `"settings"`, `"magnifier"`, `"measurer"`, `"accessibility"`, `"logs"`, and `"network"`. Unknown ids are ignored and missing ids are appended in the default order. `hidden` removes entries from the toolbar only; `"settings"` is always forced visible. Users can reorder entries within each Dock feature group from Settings.

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    dockEntries: {
      order: ["grab", "settings", "logs", "network", "magnifier", "measurer", "accessibility"],
      hidden: ["network"],
    },
  },
});
```

## `consoleCapture`

| Field              | Type         | Default                                 | Description                                      |
| ------------------ | ------------ | --------------------------------------- | ------------------------------------------------ |
| `enabled`          | `boolean`    | `true`                                  | Enable the capture subsystem.                    |
| `maxEntries`       | `number`     | `200`                                   | Ring buffer capacity.                            |
| `levels`           | `LogLevel[]` | `["log","info","warn","error","debug"]` | Which `console.*` methods to intercept.          |
| `captureUnhandled` | `boolean`    | `true`                                  | Capture `window.error` and `unhandledrejection`. |
| `captureVueErrors` | `boolean`    | `true`                                  | Capture Vue `app.config.errorHandler` errors.    |

See [Console Capture](../features/console-capture) for behavior details.

## `networkCapture`

| Field           | Type                        | Default                                              | Description                                            |
| --------------- | --------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `enabled`       | `boolean`                   | `true`                                               | Enable fetch/XHR capture.                              |
| `maxEntries`    | `number`                    | `100`                                                | Ring buffer capacity.                                  |
| `captureFetch`  | `boolean`                   | `true`                                               | Intercept `window.fetch`.                              |
| `captureXhr`    | `boolean`                   | `true`                                               | Intercept `XMLHttpRequest`.                            |
| `captureBodies` | `boolean`                   | `false`                                              | Capture request/response bodies when safe and textual. |
| `bodyMaxBytes`  | `number`                    | `2048`                                               | Max bytes retained per captured body.                  |
| `redactHeaders` | `readonly string[]`         | auth/cookie/set-cookie/x-api-key                     | Lowercase header names to redact before buffering.     |
| `urlDenyList`   | `readonly string[]`         | `["/__open-in-editor"]`                              | URL substrings skipped entirely.                       |
| `grabSnapshot`  | `NetworkGrabSnapshotConfig` | `{ enabled: true, maxEntries: 20, windowMs: 10000 }` | Recent network entries attached to each `GrabResult`.  |

See [Network Capture](../features/network-capture) for body capture, redaction, and snapshot behavior.

## `magnifier`

| Field                  | Type      | Default | Description                                      |
| ---------------------- | --------- | ------- | ------------------------------------------------ |
| `enabled`              | `boolean` | `true`  | Enable the loupe while grabbing.                 |
| `loupeSize`            | `number`  | `400`   | Loupe diameter in pixels.                        |
| `zoomLevel`            | `number`  | `3`     | Zoom factor.                                     |
| `showHtmlOverlay`      | `boolean` | `true`  | Overlay the element's HTML snippet on the loupe. |
| `maxOverlayHtmlLength` | `number`  | `200`   | Truncate the HTML overlay at this length.        |

## `measurer`

| Field                 | Type      | Default     | Description                                      |
| --------------------- | --------- | ----------- | ------------------------------------------------ |
| `enabled`             | `boolean` | `true`      | Enable the `Alt+Shift+M` measurer.               |
| `lineColor`           | `string`  | `"#06b6d4"` | Distance-line color.                             |
| `guideColor`          | `string`  | `"#a855f7"` | Alignment guide color.                           |
| `lineWidth`           | `number`  | `1`         | Distance-line stroke width.                      |
| `showAlignmentGuides` | `boolean` | `true`      | Render alignment guides when edges nearly match. |
| `alignmentTolerance`  | `number`  | `3`         | Pixel tolerance for alignment detection.         |

## Merge semantics

`mergeConfig()` deep-merges nested objects but replaces array fields wholesale. That keeps a partial override like `levels: ["error"]` from accidentally becoming a superset of defaults.

```ts
import { DEFAULT_CONFIG, mergeConfig } from "@sakana-y/vue-grab-shared";

const config = mergeConfig(DEFAULT_CONFIG, {
  consoleCapture: { levels: ["warn", "error"] },
  networkCapture: {
    redactHeaders: ["authorization", "x-internal-token"],
    urlDenyList: ["/__open-in-editor", "/metrics"],
  },
});
```
