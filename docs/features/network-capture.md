# Network Capture

Vue Grab captures `fetch` and `XMLHttpRequest` traffic into a ring buffer so you can hand a slice of recent network activity to an agent alongside the grabbed element — the "why did this button fail" context that console output alone can't give.

## What gets captured

| Source           | How it's captured                                                                            | Emitted as                                      |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `window.fetch`   | Wrapping `fetch`; original is always invoked and textual bodies are cloned only when enabled | `initiator: "fetch"`, request/response metadata |
| `XMLHttpRequest` | Patching `open` / `setRequestHeader` / `send` + listening on `loadend`                       | `initiator: "xhr"`, same schema                 |

Each entry carries: `method`, `url`, `status` (+ `statusClass`: `2xx`/`3xx`/`4xx`/`5xx`/`failed`), `duration`, redacted headers, and the source file/line of the initiator when extractable from the call stack. Request and response bodies are included only when `captureBodies` is enabled.

Aborted requests, network errors, and CORS failures all land as `statusClass: "failed"` with an `error` string.

## Ring buffer

Default capacity is **100** entries. When full, the oldest entry is evicted. Tune it:

```ts
createVueGrab({
  networkCapture: { maxEntries: 250 },
});
```

## Grab snapshot

Unlike console capture, recent network entries **are attached to every `GrabResult`** as `result.network`. That's the whole point: when the user grabs the button that didn't work, the failed request lands in the payload automatically.

```ts
createVueGrab({
  networkCapture: {
    grabSnapshot: {
      enabled: true,
      maxEntries: 20, // include at most 20 recent requests
      windowMs: 10_000, // only entries from the last 10s
    },
  },
});
```

Set `enabled: false` if you prefer the logs-style separation (panel-only, nothing attached to grabs).

## Deduplication

Consecutive entries with the same fingerprint — `${method}::${url}::${statusClass}` — collapse into one with a `count`. Polling loops don't drown out everything else; a 5xx that recurs ten times is one entry with `×10`.

## Body capture + redaction

Bodies are not captured by default. If you enable `captureBodies`, request and textual response bodies are truncated to **2048 bytes** per body. Only textual content types (`text/*`, `*/json`, `application/x-www-form-urlencoded`, `application/xml`, `application/javascript`) are read; binary responses skip the body entirely.

Sensitive headers are redacted by default: `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key` (case-insensitive). The original values never enter the buffer.

```ts
createVueGrab({
  networkCapture: {
    captureBodies: true,
    bodyMaxBytes: 4096,
    redactHeaders: ["authorization", "cookie", "set-cookie", "x-api-key", "x-internal-token"],
  },
});
```

`redactHeaders` and `urlDenyList` are both **replaced wholesale** by `mergeConfig()` — pass the full list you want, not just additions.

## Excluding URLs

`urlDenyList` is a list of substrings; any URL containing one is skipped entirely (no entry recorded, no badge bump). By default it excludes `/__open-in-editor` so vue-grab's own Vite endpoint doesn't clutter the panel.

```ts
createVueGrab({
  networkCapture: {
    urlDenyList: ["/__open-in-editor", "/metrics", "/heartbeat"],
  },
});
```

## Reading the buffer

From the standalone entry:

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init();
grab.onNetwork((entries) => console.table(entries));
grab.clearNetwork();
```

## FAB integration

When `floatingButton.enabled` is true, the **Network panel** shows:

- Five status pills (`2xx` / `3xx` / `4xx` / `5xx` / `failed`) with per-class counts — click to filter
- A URL search input
- Each row: method, status, URL, duration, time — expand for headers, request/response body, and actions (Copy, Open in Claude Code, Open in Editor for the initiator file)
- The FAB badge turns **red** when any 5xx or failed request is present, **amber** when only 4xx — 2xx/3xx are ignored

See [Floating Button →](./floating-button).
