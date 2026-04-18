# Configuration

All configuration is optional. Pass a partial `GrabConfig` to `createVueGrab()` or `init()` — it is deep-merged with `DEFAULT_CONFIG` via `mergeConfig()` from `@sakana-y/vue-grab-shared`.

```ts
import { createVueGrab } from "@sakana-y/vue-grab";

createVueGrab({
  highlightColor: "#4f46e5",
  maxHtmlLength: 5000,
  floatingButton: { enabled: true },
  consoleCapture: { maxEntries: 500 },
  filter: { ignoreTags: ["script", "style"] },
});
```

## Top-level options

| Field            | Type                   | Default     | Description                                    |
| ---------------- | ---------------------- | ----------- | ---------------------------------------------- |
| `highlightColor` | `string`               | `"#4f46e5"` | Overlay border and label background.           |
| `labelTextColor` | `string`               | `"#ffffff"` | Label text color.                              |
| `showTagHint`    | `boolean`              | `true`      | Show `<tagname>` pill in the overlay label.    |
| `maxHtmlLength`  | `number`               | `10_000`    | Truncate outerHTML at this length.             |
| `filter`         | `GrabFilterConfig`     | see below   | What the engine skips when hovering.           |
| `floatingButton` | `FloatingButtonConfig` | disabled    | Optional FAB with settings/logs/a11y panels.   |
| `consoleCapture` | `ConsoleCaptureConfig` | enabled     | Ring-buffered console + runtime error capture. |
| `magnifier`      | `MagnifierConfig`      | enabled     | Loupe overlay that appears while grabbing.     |
| `measurer`       | `MeasurerConfig`       | enabled     | Element-to-element spacing inspector.          |

## `filter`

| Field                  | Type       | Default | Description                                                      |
| ---------------------- | ---------- | ------- | ---------------------------------------------------------------- |
| `ignoreSelectors`      | `string[]` | `[]`    | CSS selectors the engine will refuse to highlight.               |
| `ignoreTags`           | `string[]` | `[]`    | Tag names the engine will refuse to highlight.                   |
| `skipCommonComponents` | `boolean`  | `false` | Skip generic wrapper components (e.g. `Fragment`, `Transition`). |

## `floatingButton`

| Field                      | Type                               | Default                      | Description                                             |
| -------------------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `enabled`                  | `boolean`                          | `false`                      | Render the FAB. Off by default so you can opt in.       |
| `initialPosition`          | `"top-center" \| "top-right" \| …` | `"top-center"`               | Starting position before the user drags it.             |
| `storageKey`               | `string`                           | `"vue-grab-fab-pos"`         | localStorage key for persisted position.                |
| `hotkeyStorageKey`         | `string`                           | `"vue-grab-hotkey"`          | localStorage key for the user-customized grab hotkey.   |
| `editorStorageKey`         | `string`                           | `"vue-grab-editor"`          | localStorage key for the user-preferred editor command. |
| `measurerHotkeyStorageKey` | `string`                           | `"vue-grab-measurer-hotkey"` | localStorage key for the measurer hotkey.               |

## `consoleCapture`

See [Console Capture →](../features/console-capture) for the full behavior. Defaults:

```ts
{
  enabled: true,
  maxEntries: 200,
  levels: ["log", "info", "warn", "error", "debug"],
  captureUnhandled: true,
  captureVueErrors: true,
}
```

## `magnifier`

| Field                  | Type      | Default | Description                                      |
| ---------------------- | --------- | ------- | ------------------------------------------------ |
| `enabled`              | `boolean` | `true`  | Show the loupe while grabbing.                   |
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

`mergeConfig()` deep-merges nested objects but **replaces `consoleCapture.levels` wholesale** rather than element-merging. That keeps `levels: ["error"]` from accidentally being a superset of the default.

```ts
import { DEFAULT_CONFIG, mergeConfig } from "@sakana-y/vue-grab-shared";

const config = mergeConfig(DEFAULT_CONFIG, {
  consoleCapture: { levels: ["warn", "error"] }, // only these two
});
```
