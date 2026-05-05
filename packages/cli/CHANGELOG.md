# @sakana-y/vue-grab-cli

## 0.1.1

### Patch Changes

- [#30](https://github.com/SaKaNa-Y/vue-grab/pull/30) [`33772ce`](https://github.com/SaKaNa-Y/vue-grab/commit/33772ce81dc425d3f9a93d43faf1f809ff45c2a4) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Implement `vue-grab init` for Vite + Vue projects with safe setup edits, dependency installation, dry-run support, and Vite plugin wiring.

## 0.1.0

### Minor Changes

- [#21](https://github.com/SaKaNa-Y/vue-grab/pull/21) [`6df5750`](https://github.com/SaKaNa-Y/vue-grab/commit/6df5750f22dc975340180c22a656294a4d85291d) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Rename `errorCapture` → `consoleCapture` and broaden capture from `console.error` only to all five console levels (`log`, `info`, `warn`, `error`, `debug`). The FloatingButton panel now surfaces every captured entry with per-level filter pills and a message search input; the badge counts only `warn` + `error` entries to keep it actionable.

  Breaking changes — no backwards-compatible aliases:
  - Config key `errorCapture` → `consoleCapture`.
  - Type `ErrorCaptureConfig` → `ConsoleCaptureConfig`:
    - `maxErrors` (default 50) → `maxEntries` (default 200).
    - `captureConsoleError: boolean` replaced by `levels: LogLevel[]` (default is all five levels enabled). The levels array is replaced wholesale by `mergeConfig`, not element-merged.
    - `captureUnhandled` and `captureVueErrors` retained with identical semantics.
  - Type `CapturedError` → `CapturedLog`. The single `type` field is replaced with two axes: `level: "log" | "info" | "warn" | "error" | "debug"` and `source: "console" | "runtime" | "promise" | "vue"`. Runtime/promise/Vue entries always carry `level: "error"`.
  - Constant `VUE_ERROR_EVENT` retained (the underlying window-event string `"vue-grab:vue-error"` is unchanged).
  - Standalone `init()` API: `onError` / `clearErrors` → `onLog` / `clearLogs`.
  - FloatingButton methods: `setErrors` / `onErrorsClear` → `setLogs` / `onLogsClear` (internal, only affects code that imports `FloatingButton` directly).
  - Dedup fingerprint now includes `source` and `level`, so the same message at different levels or from different sources produces distinct entries.
  - Arguments passed to `console.*` are now stringified at capture time via a safe stringifier that handles circular references, Error instances (preserving `.stack`), and truncates very long values.
