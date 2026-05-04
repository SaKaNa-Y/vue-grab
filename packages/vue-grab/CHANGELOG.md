# @sakana-y/vue-grab

## 0.1.1

### Patch Changes

- [#35](https://github.com/SaKaNa-Y/vue-grab/pull/35) [`56d9d44`](https://github.com/SaKaNa-Y/vue-grab/commit/56d9d448c62ce2f11607fe7bf5b570ce4ecad40a) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Add floating-button toolbar entry visibility and ordering preferences with a locked Settings entry, grouped shortcut settings, and drag reordering within Dock feature groups.

- [#31](https://github.com/SaKaNa-Y/vue-grab/pull/31) [`151ffdb`](https://github.com/SaKaNa-Y/vue-grab/commit/151ffdbd6b8b56ecff1437debd3a38cfbc57b618) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Expose shared protocol constants and request types for advanced integrations.

- [#32](https://github.com/SaKaNa-Y/vue-grab/pull/32) [`14163a0`](https://github.com/SaKaNa-Y/vue-grab/commit/14163a075eeb8783a490b7997e8b8ce1b048b9c7) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Add floating-button dock modes with persisted Float and Edge panel behavior plus outside-click panel closing.

- [#28](https://github.com/SaKaNa-Y/vue-grab/pull/28) [`4ad57b5`](https://github.com/SaKaNa-Y/vue-grab/commit/4ad57b57e86a4c3c3f37d1d951ab69b8c5151a97) Thanks [@SaKaNa-Y](https://github.com/SaKaNa-Y)! - Harden the Vite open-in-editor endpoint and make network body capture opt-in by default.

- Updated dependencies [[`56d9d44`](https://github.com/SaKaNa-Y/vue-grab/commit/56d9d448c62ce2f11607fe7bf5b570ce4ecad40a), [`151ffdb`](https://github.com/SaKaNa-Y/vue-grab/commit/151ffdbd6b8b56ecff1437debd3a38cfbc57b618), [`14163a0`](https://github.com/SaKaNa-Y/vue-grab/commit/14163a075eeb8783a490b7997e8b8ce1b048b9c7), [`4ad57b5`](https://github.com/SaKaNa-Y/vue-grab/commit/4ad57b57e86a4c3c3f37d1d951ab69b8c5151a97)]:
  - @sakana-y/vue-grab-shared@0.1.1

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

### Patch Changes

- Updated dependencies [[`6df5750`](https://github.com/SaKaNa-Y/vue-grab/commit/6df5750f22dc975340180c22a656294a4d85291d)]:
  - @sakana-y/vue-grab-shared@0.1.0
