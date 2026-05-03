# Network Capture

Vue Grab captures `fetch` and `XMLHttpRequest` activity into a ring buffer so an agent can see the request context around the UI you grabbed.

## What gets captured

| Source           | How it is captured                                                                                  | Emitted as                                      |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `window.fetch`   | Wrapping `fetch`; the original request still runs, and textual bodies are cloned only when enabled. | `initiator: "fetch"`, request/response metadata |
| `XMLHttpRequest` | Patching `open`, `setRequestHeader`, and `send`, then listening for `loadend`.                      | `initiator: "xhr"`, same schema                 |

Each entry carries `method`, `url`, `status`, `statusClass`, `duration`, redacted headers, timestamps, deduplication count, and the initiator file/line when extractable from the stack. Aborted requests, network errors, and CORS failures use `statusClass: "failed"` with an `error` string.

## Body capture is opt-in

Bodies are **not** captured by default:

```ts
createVueGrab({
  networkCapture: {
    captureBodies: false,
  },
});
```

When `captureBodies` is true, request bodies and textual response bodies are truncated to `bodyMaxBytes` bytes. Textual content types include `text/*`, JSON, form data, XML, and JavaScript. Binary responses skip body capture entirely.

```ts
createVueGrab({
  networkCapture: {
    captureBodies: true,
    bodyMaxBytes: 4096,
  },
});
```

## Header redaction

Sensitive headers are redacted before entries reach the buffer. Defaults are case-insensitive and include:

- `authorization`
- `cookie`
- `set-cookie`
- `x-api-key`

```ts
createVueGrab({
  networkCapture: {
    redactHeaders: ["authorization", "cookie", "set-cookie", "x-api-key", "x-internal-token"],
  },
});
```

`redactHeaders` is replaced wholesale by `mergeConfig()`, so pass the full list you want.

## Excluding URLs

`urlDenyList` is a list of substrings. Any URL containing one is skipped entirely. By default it excludes `/__open-in-editor` so Vue Grab's own Vite editor endpoint does not clutter the panel.

```ts
createVueGrab({
  networkCapture: {
    urlDenyList: ["/__open-in-editor", "/metrics", "/heartbeat"],
  },
});
```

`urlDenyList` is also replaced wholesale by `mergeConfig()`.

## Grab snapshot

Recent network entries are attached to each `GrabResult` as `result.network` when `grabSnapshot.enabled` is true. The default includes at most 20 entries from the previous 10 seconds.

```ts
createVueGrab({
  networkCapture: {
    grabSnapshot: {
      enabled: true,
      maxEntries: 20,
      windowMs: 10000,
    },
  },
});
```

Set `grabSnapshot.enabled` to `false` if you only want network data in the floating button panel or standalone `onNetwork()` subscription.

## Ring buffer and deduplication

Default capacity is 100 entries. When full, the oldest entry is evicted. Consecutive entries with the same `${method}::${url}::${statusClass}` fingerprint collapse into one entry with an incremented `count`.

## Reading the buffer

From the standalone entry:

```ts
import { init } from "@sakana-y/vue-grab";

const grab = init();
grab.onNetwork((entries) => console.table(entries));
grab.clearNetwork();
```

## Floating Button integration

When `floatingButton.enabled` is true, the Network panel shows status filter pills, URL search, expandable request rows, copy-to-prompt actions, Claude Code handoff, and editor opening for initiator files when available.

The floating button badge turns red when any `5xx` or failed request is present, amber when only `4xx` requests are present, and ignores `2xx`/`3xx` traffic.

See [Floating Button](./floating-button).
