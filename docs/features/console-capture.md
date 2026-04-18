# Console Capture

Vue Grab captures browser console output and runtime errors into a ring buffer so you can hand a slice of them to an agent alongside the grabbed element.

## What gets captured

| Source               | How it's captured                                | Emitted as                               |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `console.*`          | Patching `log`, `info`, `warn`, `error`, `debug` | `level: <matching>`, `source: "console"` |
| `window.error`       | Global error listener                            | `level: "error"`, `source: "runtime"`    |
| `unhandledrejection` | Global rejection listener                        | `level: "error"`, `source: "promise"`    |
| Vue `errorHandler`   | `app.config.errorHandler` shim                   | `level: "error"`, `source: "vue"`        |

Each entry carries both axes (`level` and `source`), so the FAB panel can filter by level while still showing _where_ the entry came from.

## Ring buffer

Default capacity is **200** entries. When full, the oldest entry is evicted. Tune it:

```ts
createVueGrab({
  consoleCapture: { maxEntries: 500 },
});
```

## Deduplication

Consecutive entries with the same fingerprint — `${source}::${level}::${message}` — collapse into one with a `count`. Handy when a logger spams the same warning in a loop.

## Safe stringification

Arguments are stringified with a safe serializer that handles **circular references** and swaps unserializable values (functions, DOM nodes, `Symbol`s) for placeholder strings. The original `console.*` output is still printed to the real console untouched.

## Filtering capture

```ts
createVueGrab({
  consoleCapture: {
    enabled: true,
    levels: ["warn", "error"], // only warn + error from console.*
    captureUnhandled: true, // still capture runtime errors + rejections
    captureVueErrors: true, // and Vue errorHandler errors
  },
});
```

`levels` is **replaced wholesale** by `mergeConfig()` rather than element-merged — `["warn", "error"]` means exactly those two, not "defaults + these".

## Reading the buffer

From a component:

```ts
import { useGrab } from "@sakana-y/vue-grab";

const { config } = useGrab();
// FAB panel reads through the engine; programmatic access is via init()
```

From the standalone entry:

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init();
grab.onLog((entries) => console.table(entries));
grab.clearLogs();
```

## FAB integration

When `floatingButton.enabled` is true, the **Logs panel** shows:

- Five color-coded level pills (`log` / `info` / `warn` / `error` / `debug`) — click to filter
- A message search input
- The FAB badge counts only `warn` + `error` entries, not the noisy levels

See [Floating Button →](./floating-button).
