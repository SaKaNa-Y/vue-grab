# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use Node `>=22.0.0` and pnpm `>=10.0.0`; the repo pins `pnpm@10.24.0`.

```bash
pnpm build              # Build all packages (turbo)
pnpm dev                # Dev mode for all packages
pnpm dev:playground     # Run playground dev server only
pnpm docs:dev           # Run docs (VitePress) dev server only
pnpm test               # Run all tests (turbo)
pnpm typecheck          # Type-check all packages (turbo)
pnpm lint               # Lint with oxlint (Vue + Vitest plugins)
pnpm lint:fix           # Lint and auto-fix
pnpm format             # Format with oxfmt (write)
pnpm format:check       # Check formatting (CI)
```

Run a single package's tests:

```bash
pnpm --filter @sakana-y/vue-grab test -- --reporter=verbose
pnpm --filter @sakana-y/vue-grab-shared test
```

Release flow: `pnpm changeset` -> `pnpm version-packages` -> `pnpm release`

## Architecture

pnpm monorepo orchestrated by Turbo. All packages build with Vite 8.

```text
@sakana-y/vue-grab-shared - Shared types (GrabConfig, GrabResult, ComponentInfo), constants (DEFAULT_CONFIG), protocol values, and mergeConfig()
@sakana-y/vue-grab        - Core Vue 3 plugin/runtime: GrabEngine, GrabOverlay, HotkeyManager, useGrab, createVueGrab, init(), plus ./vite entry point
@sakana-y/vue-grab-cli    - CLI tool (CAC) with vue-grab init
playground                - Private dev demo app
docs                      - Private VitePress documentation site
```

Dependency graph: `vue-grab -> shared`, `playground -> vue-grab`. CLI and docs are standalone.

Changesets links vue-grab, cli, and shared for coordinated versioning. Playground and docs are excluded from releases.

## Key Patterns

- **Shadow DOM overlay**: `GrabOverlay`, magnifier, measurer, and `FloatingButton` render isolated UI hosts so app styles do not bleed into Vue Grab UI.
- **Typed InjectionKey**: Plugin uses `Symbol()` as a typed `InjectionKey<GrabConfig>`; never use string keys.
- **Capture-phase events**: `GrabEngine` registers mousemove/click/keydown with `capture: true` to intercept before app handlers.
- **Config deep-merge**: `mergeConfig()` in shared handles nested objects (`filter`, `floatingButton`, `consoleCapture`, `networkCapture`, `magnifier`, `measurer`). Use it instead of spread for config overrides. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.
- **Component stack extraction**: Walks `__vueParentComponent` to build the Vue component hierarchy.
- **HTML truncation**: Respects `maxHtmlLength` config and truncates with the `<!-- truncated -->` marker.
- **Dual entry points**: `@sakana-y/vue-grab` is the core plugin/runtime API, and `@sakana-y/vue-grab/vite` is the Vite dev server plugin.
- **Vite plugin endpoints**: `/__open-in-editor` opens files through `launch-editor`, rejects paths outside the project root, and is excluded from network capture by default.
- **Session wiring**: `createGrabSession()` composes GrabEngine, HotkeyManager, console/network capture, optional FloatingButton, magnifier, and measurer into one lifecycle.
- **FloatingButton**: Shadow DOM toolbar with drag, snap-to-edge, Float/Edge dock modes, Dock/Shortcuts/Tools settings tabs, a11y/logs/network panels, magnifier controls, and measurer controls. Dock layout persists to `vue-grab-dock-entries`; feature shortcuts persist to `vue-grab-shortcuts`; position/editor preferences use `vue-grab-fab-pos` and `vue-grab-editor`.
- **Shortcut compatibility**: `floatingButton.hotkeyStorageKey` (`vue-grab-hotkey`) and `floatingButton.measurerHotkeyStorageKey` (`vue-grab-measurer-hotkey`) remain for legacy grab/measurer hotkey migration while `floatingButton.shortcuts` is the current multi-feature shortcut config.
- **Console capture**: `utils/console-capture.ts` patches the 5 console levels, plus window `error`/`unhandledrejection` and Vue `errorHandler` (all mapped to `level: "error"` with distinct `source`). Ring buffer default is 200, dedup uses `${source}::${level}::${message}`, safe stringifier handles circular refs, and the FAB badge counts only warn+error entries.
- **Network capture**: `utils/network-capture.ts` captures fetch/XHR metadata, redacts configured headers, skips configured URL deny-list substrings, classifies status as `2xx`/`3xx`/`4xx`/`5xx`/`failed`, supports body capture, drives network panel status filters/search, and attaches recent snapshots to `GrabResult.network`.
- **A11y audit**: `utils/a11y.ts` provides `hasA11yAttributes()` (fast, used on mousemove), `extractA11yInfo()` (full extraction), and `scanPageA11y()` (page-wide Vue component scan with 5 audit rules).

## Testing

- **vue-grab**: Browser tests via Vitest 4 + Playwright (Chromium). Coverage uses the V8 provider.
- **cli, shared**: Node-environment Vitest tests.
- All Vitest configs use `globals: true`.
