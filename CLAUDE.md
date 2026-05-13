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
pnpm version-packages   # Apply Changesets version updates through .env
pnpm release            # Publish packages with Changesets
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
@sakana-y/vue-grab-shared - Shared public contracts: types, DEFAULT_CONFIG, protocol constants, editor allow-list values, and mergeConfig()
@sakana-y/vue-grab        - Core Vue 3 plugin/runtime: createVueGrab(), useGrab(), init(), FloatingButton, overlays, editor helpers, plus ./vite entry point
@sakana-y/vue-grab-cli    - CAC-powered CLI tool with vue-grab init
playground                - Private local demo app for manual testing
docs                      - Private VitePress documentation site
.changeset               - Changesets release metadata for linked package versioning
```

Dependency graph: `vue-grab -> shared`, `playground -> vue-grab`. CLI and docs are standalone.

Changesets links vue-grab, cli, and shared for coordinated versioning. Playground and docs are excluded from releases.

## Key Patterns

- **Shadow DOM overlay**: `GrabOverlay`, magnifier, measurer, and `FloatingButton` render isolated UI hosts so app styles do not bleed into Vue Grab UI.
- **Typed InjectionKey**: Plugin uses `Symbol()` as a typed `InjectionKey<GrabConfig>`; never use string keys.
- **Capture-phase events**: `GrabEngine` registers mousemove/click/keydown with `capture: true` to intercept before app handlers.
- **Config deep-merge**: `mergeConfig()` in shared handles nested objects (`filter`, `floatingButton`, `consoleCapture`, `networkCapture`, `magnifier`, `measurer`). Use it instead of spread for config overrides. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.
- **Floating button config**: `floatingButton.dockEntries` controls toolbar order/visibility, `floatingButton.shortcuts` is the current multi-feature shortcut map, and `floatingButton.closeOnOutsideClick` controls whether panels close on outside clicks.
- **Component stack extraction**: Walks `__vueParentComponent` to build the Vue component hierarchy.
- **HTML truncation**: Respects `maxHtmlLength` config and truncates with the `<!-- truncated -->` marker.
- **Public entry points**: `@sakana-y/vue-grab` is the core plugin/runtime API, `@sakana-y/vue-grab/vite` is the Vite dev server plugin, and `@sakana-y/vue-grab-shared` exposes stable types/defaults/protocol values for tooling.
- **Vite plugin endpoint**: `/__open-in-editor` opens files through `launch-editor`, rejects paths outside the project root, validates per-request editor values against the shared allow-list, injects `__VUE_GRAB_ROOT__`, and is excluded from network capture by default.
- **Session wiring**: `createGrabSession()` composes GrabEngine, HotkeyManager, console/network capture, optional FloatingButton, magnifier, and measurer into one lifecycle.
- **FloatingButton**: Shadow DOM toolbar with drag, snap-to-edge, Float/Edge dock modes, Dock/Shortcuts/Tools settings tabs, a11y/logs/network panels, magnifier controls, and measurer controls. Position, dock mode, dock layout, feature shortcuts, editor preference, and outside-click behavior persist to `vue-grab-fab-pos`, `vue-grab-dock-mode`, `vue-grab-dock-entries`, `vue-grab-shortcuts`, `vue-grab-editor`, and `vue-grab-close-on-outside-click`.
- **Shortcut compatibility**: `floatingButton.hotkeyStorageKey` (`vue-grab-hotkey`) and `floatingButton.measurerHotkeyStorageKey` (`vue-grab-measurer-hotkey`) remain for legacy grab/measurer hotkey migration while `floatingButton.shortcuts` is the current multi-feature shortcut config.
- **Console capture**: `utils/console-capture.ts` patches the 5 console levels, plus window `error`/`unhandledrejection` and Vue `errorHandler` (all mapped to `level: "error"` with distinct `source`). Ring buffer default is 200, dedup uses `${source}::${level}::${message}`, safe stringifier handles circular refs, and the FAB badge counts only warn+error entries.
- **Network capture**: `utils/network-capture.ts` captures fetch/XHR metadata, redacts configured headers, skips configured URL deny-list substrings, classifies status as `2xx`/`3xx`/`4xx`/`5xx`/`failed`, supports body capture, drives network panel status filters/search, and uses `networkCapture.grabSnapshot` to attach recent snapshots to `GrabResult.network`.
- **A11y audit**: `utils/a11y.ts` provides `hasA11yAttributes()` (fast, used on mousemove), `extractA11yInfo()` (full extraction), and `scanPageA11y()` (page-wide Vue component scan with 5 audit rules).

## Testing

- **vue-grab**: Browser tests via Vitest 4 + Playwright (Chromium). Coverage uses the V8 provider.
- **cli, shared**: Node-environment Vitest tests.
- All Vitest configs use `globals: true`.
