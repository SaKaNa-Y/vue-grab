# API Reference

## `createVueGrab(options?)`

Creates a Vue plugin instance.

```ts
import { createVueGrab } from "@sakana-y/vue-grab";

app.use(
  createVueGrab({
    highlightColor: "#4f46e5",
    showTagHint: true,
  }),
);
```

## `useGrab()`

Composable for accessing grab configuration within components.

```ts
import { useGrab } from "@sakana-y/vue-grab";

const { config } = useGrab();
```

## `init(options?)`

Standalone initialization for non-Vue contexts (e.g., CDN script tag).

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init({ highlightColor: "#ef4444" });

grab.onLog((entries) => console.table(entries));
grab.clearLogs();
```

The returned object exposes:

| Method         | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `activate()`   | Enter grab mode.                                                        |
| `deactivate()` | Exit grab mode.                                                         |
| `onGrab(cb)`   | Subscribe to grab results. Returns an unsubscribe function.             |
| `onLog(cb)`    | Subscribe to captured console entries. Returns an unsubscribe function. |
| `clearLogs()`  | Clear the captured log buffer.                                          |
| `destroy()`    | Tear down the session.                                                  |

## `consoleCapture` config

Controls capture of browser console output and runtime errors. Merged via `mergeConfig` — `levels` is replaced wholesale rather than element-merged.

| Field              | Type         | Default                                 | Description                                                                                                      |
| ------------------ | ------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `enabled`          | `boolean`    | `true`                                  | Enable the capture subsystem.                                                                                    |
| `maxEntries`       | `number`     | `200`                                   | Ring buffer capacity (oldest evicted when exceeded).                                                             |
| `levels`           | `LogLevel[]` | `["log","info","warn","error","debug"]` | Which `console.*` methods to intercept.                                                                          |
| `captureUnhandled` | `boolean`    | `true`                                  | Capture `window.error` and `unhandledrejection` (emitted as `level: "error"`, `source: "runtime" \| "promise"`). |
| `captureVueErrors` | `boolean`    | `true`                                  | Capture `app.config.errorHandler` errors (emitted as `level: "error"`, `source: "vue"`).                         |

`LogLevel = "log" | "info" | "warn" | "error" | "debug"` and `LogSource = "console" | "runtime" | "promise" | "vue"`. Each `CapturedLog` carries both axes so the FAB panel can filter by level and display the source independently. The FAB badge counts only entries with `level === "warn"` or `"error"`.

## Advanced shared API

Most applications should import from `@sakana-y/vue-grab`. Integrations and tooling can import stable contracts from `@sakana-y/vue-grab-shared` when they need Vue Grab data types, default config, `mergeConfig()`, or protocol constants without depending on the Vue runtime entrypoint.

```ts
import type { GrabResult, OpenInEditorRequest } from "@sakana-y/vue-grab-shared";
import { OPEN_IN_EDITOR_ENDPOINT } from "@sakana-y/vue-grab-shared";
```
