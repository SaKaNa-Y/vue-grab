# Console Capture

Vue Grab captures browser console output and runtime errors into a ring buffer so you can hand a slice of them to an agent alongside the grabbed element.

## What gets captured

| Source               | How it is captured                               | Emitted as                               |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `console.*`          | Patching `log`, `info`, `warn`, `error`, `debug` | `level: <matching>`, `source: "console"` |
| `window.error`       | Global error listener                            | `level: "error"`, `source: "runtime"`    |
| `unhandledrejection` | Global rejection listener                        | `level: "error"`, `source: "promise"`    |
| Vue `errorHandler`   | `app.config.errorHandler` shim                   | `level: "error"`, `source: "vue"`        |

Each entry carries both axes (`level` and `source`), so the floating button panel can filter by level while still showing where the entry came from.

## Ring buffer

Default capacity is 200 entries. When full, the oldest entry is evicted.

```ts
createVueGrab({
  consoleCapture: { maxEntries: 500 },
});
```

## Deduplication

Consecutive entries with the same `${source}::${level}::${message}` fingerprint collapse into one with an incremented `count`.

## Safe stringification

Arguments are stringified with a safe serializer that handles circular references and swaps unserializable values such as functions, DOM nodes, and symbols for placeholder strings. The original `console.*` output is still printed to the real console.

## Filtering capture

```ts
createVueGrab({
  consoleCapture: {
    enabled: true,
    levels: ["warn", "error"],
    captureUnhandled: true,
    captureVueErrors: true,
  },
});
```

`levels` is replaced wholesale by `mergeConfig()`. `["warn", "error"]` means exactly those two console methods, not "defaults plus these".

## Reading the buffer

From the standalone entry:

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init();
grab.onLog((entries) => console.table(entries));
grab.clearLogs();
```

## Floating Button integration

When `floatingButton.enabled` is true, the Logs panel shows five level filter pills, a message search input, expandable entries, copy-to-prompt actions, Claude Code handoff, and editor opening when a source file can be resolved.

The floating button badge counts only `warn` and `error` entries from the log buffer.

See [Floating Button](./floating-button).
