# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

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

Release flow: `pnpm changeset` → `pnpm version-packages` → `pnpm release`

## Architecture

pnpm monorepo orchestrated by Turbo. All packages build with Vite 8.

```
@sakana-y/vue-grab-shared   — Shared types (GrabConfig, GrabResult, ComponentInfo) and constants (DEFAULT_CONFIG, mergeConfig)
@sakana-y/vue-grab          — Core Vue 3 plugin: GrabEngine, GrabOverlay, HotkeyManager, useGrab composable, createVueGrab plugin, init() for non-Vue
@sakana-y/vue-grab-cli      — CLI tool (CAC) with `vue-grab init` command
playground                — Dev demo app (private, root-level)
docs                      — VitePress documentation site (private, root-level)
```

Dependency graph: `vue-grab → shared`, `playground → vue-grab`. CLI and docs are standalone.

Changesets links vue-grab, cli, and shared for coordinated versioning. Playground and docs are excluded from releases.

## Key Patterns

- **Shadow DOM overlay**: `GrabOverlay` mounts a Shadow DOM host to isolate highlight/label styles from the page
- **Typed InjectionKey**: Plugin uses `Symbol()` as a typed `InjectionKey<GrabConfig>` — never use string keys
- **Capture-phase events**: `GrabEngine` registers mousemove/click/keydown with `capture: true` to intercept before app handlers
- **Config deep-merge**: `mergeConfig()` in shared handles nested objects (`filter`, `floatingButton`, `consoleCapture`, `magnifier`, `measurer`) — use it instead of spread for config overrides. `consoleCapture.levels` is replaced wholesale rather than element-merged.
- **Component stack extraction**: Walks `__vueParentComponent` to build the Vue component hierarchy
- **HTML truncation**: Respects `maxHtmlLength` config, truncates with `<!-- truncated -->` marker
- **Dual entry points**: `@sakana-y/vue-grab` (core plugin) and `@sakana-y/vue-grab/vite` (Vite dev server plugin with editor endpoint)
- **Vite plugin endpoints**: `/__open-in-editor` opens files via `launch-editor`
- **Session wiring**: `createGrabSession()` composes GrabEngine + HotkeyManager + optional FloatingButton into a single lifecycle
- **FloatingButton**: Shadow DOM component with drag, snap-to-edge, settings/a11y/logs panels. Logs panel has 5 color-coded level filter pills (log/info/warn/error/debug) and a message search input. Persists state to localStorage (`vue-grab-fab-pos`, `vue-grab-hotkey`, `vue-grab-editor`)
- **Console capture**: `utils/console-capture.ts` patches the 5 console levels, plus window `error`/`unhandledrejection` and Vue `errorHandler` (all mapped to `level: "error"` with distinct `source`). Ring buffer (default 200) with dedup fingerprint `${source}::${level}::${message}`. Safe stringifier handles circular refs. FAB badge counts only warn+error entries.
- **A11y audit**: `utils/a11y.ts` provides `hasA11yAttributes()` (fast, used on mousemove), `extractA11yInfo()` (full extraction), and `scanPageA11y()` (page-wide Vue component scan with 5 audit rules)

## Testing

- **vue-grab**: Browser tests via Vitest + Playwright (Chromium). Coverage with V8 provider.
- **cli, shared**: Node-environment Vitest tests.
- All vitest configs use `globals: true`.
