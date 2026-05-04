# API Reference

## `createVueGrab(options?)`

Creates a Vue plugin instance.

```ts
import { createVueGrab } from "@sakana-y/vue-grab";

app.use(
  createVueGrab({
    floatingButton: { enabled: true },
    highlightColor: "#4f46e5",
  }),
);
```

`options` is a nested partial `GrabConfig`; it is merged with `DEFAULT_CONFIG` through `mergeConfig()`.

## `useGrab()`

Composable for accessing grab state inside Vue components.

```ts
import { useGrab } from "@sakana-y/vue-grab";

const {
  config,
  isActive,
  lastResult,
  isMeasurerActive,
  activate,
  deactivate,
  toggle,
  toggleMeasurer,
} = useGrab();
```

| Property           | Type                                    | Description                     |
| ------------------ | --------------------------------------- | ------------------------------- |
| `config`           | `GrabConfig`                            | Resolved configuration          |
| `isActive`         | `Readonly<Ref<boolean>>`                | Whether grab mode is active     |
| `lastResult`       | `DeepReadonly<Ref<GrabResult \| null>>` | Last captured result            |
| `isMeasurerActive` | `Readonly<Ref<boolean>>`                | Whether measurer mode is active |
| `activate()`       | `() => void`                            | Enter grab mode                 |
| `deactivate()`     | `() => void`                            | Exit grab mode                  |
| `toggle()`         | `() => void`                            | Toggle grab mode                |
| `toggleMeasurer()` | `() => void`                            | Toggle the element measurer     |

## `init(options?)`

Standalone initialization for non-Vue contexts.

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init({ floatingButton: { enabled: true } });

grab.onGrab((result) => console.log(result.selector));
grab.onLog((entries) => console.table(entries));
grab.onNetwork((entries) => console.table(entries));
```

The returned object exposes:

| Method           | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `activate()`     | Enter grab mode                                                                     |
| `deactivate()`   | Exit grab mode                                                                      |
| `onGrab(cb)`     | Subscribe to grab results. Returns an unsubscribe function                          |
| `onLog(cb)`      | Subscribe to captured console entries. Returns an unsubscribe function              |
| `clearLogs()`    | Clear the captured log buffer                                                       |
| `onNetwork(cb)`  | Subscribe to captured network entries. Returns an unsubscribe function              |
| `clearNetwork()` | Clear the captured network buffer                                                   |
| `destroy()`      | Tear down the session, hotkeys, overlays, floating button, and capture interceptors |

## `GrabResult`

```ts
interface GrabResult {
  element: Element;
  html: string;
  componentStack: ComponentInfo[];
  selector: string;
  a11y: A11yInfo;
  network?: CapturedRequest[];
}
```

`network` is present when `networkCapture.enabled` and `networkCapture.grabSnapshot.enabled` are both true.

## `openInEditor(filePath, line?, editor?)`

Posts to the Vite companion endpoint so a captured file path can open in the configured editor.

```ts
import { openInEditor } from "@sakana-y/vue-grab";

openInEditor("src/components/Button.vue", 12, "code");
```

This requires `vueGrabPlugin()` from `@sakana-y/vue-grab/vite` during dev-server usage.

## `@sakana-y/vue-grab/vite`

```ts
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

vueGrabPlugin({ editor: "code" });
```

`editor` is an optional default command. A per-request editor stored from the floating button settings panel takes precedence when present.

## `@sakana-y/vue-grab-shared`

Most applications should import runtime APIs from `@sakana-y/vue-grab`. Integrations and tooling can import stable contracts from `@sakana-y/vue-grab-shared` when they need types, defaults, config merging, or protocol constants without depending on the Vue runtime entrypoint.

```ts
import type {
  FloatingButtonDockMode,
  GrabConfig,
  GrabResult,
  OpenInEditorAllowedEditor,
  OpenInEditorRequest,
} from "@sakana-y/vue-grab-shared";
import {
  DEFAULT_CONFIG,
  OPEN_IN_EDITOR_ALLOWED_EDITORS,
  OPEN_IN_EDITOR_CONTENT_TYPE,
  OPEN_IN_EDITOR_ENDPOINT,
  OPEN_IN_EDITOR_REQUEST_MAX_BYTES,
  mergeConfig,
} from "@sakana-y/vue-grab-shared";
```

Important protocol exports:

| Export                             | Value / shape                                      |
| ---------------------------------- | -------------------------------------------------- |
| `OPEN_IN_EDITOR_ENDPOINT`          | `"/__open-in-editor"`                              |
| `OPEN_IN_EDITOR_CONTENT_TYPE`      | `"application/json"`                               |
| `OPEN_IN_EDITOR_REQUEST_MAX_BYTES` | `8192`                                             |
| `OpenInEditorRequest`              | `{ file: string; line?: number; editor?: string }` |
| `FloatingButtonDockMode`           | `"float" \| "edge"`                                |
| `OpenInEditorAllowedEditor`        | See list below                                     |

Allowed editor commands are exactly: `atom`, `code`, `cursor`, `emacs`, `idea`, `nvim`, `phpstorm`, `sublime`, `vim`, `visualstudio`, `webstorm`.

## Config merge semantics

`mergeConfig()` deep-merges nested config objects and replaces array fields wholesale. In particular, `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` should be supplied as the full desired arrays.
