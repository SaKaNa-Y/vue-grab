# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo managed with Turborepo. Core packages live under `packages/`:

- `packages/vue-grab`: main Vue 3 library source in `src/`, tests in `tests/`. It publishes `@sakana-y/vue-grab` for core plugin/runtime APIs and `@sakana-y/vue-grab/vite` for the Vite dev server plugin with the open-in-editor endpoint and project-root wiring.
- `packages/shared`: public `@sakana-y/vue-grab-shared` package for shared types, `DEFAULT_CONFIG`, protocol constants, editor allow-list values, and `mergeConfig()`.
- `packages/cli`: public `@sakana-y/vue-grab-cli` package for the CAC-powered CLI entrypoint and commands, including `vue-grab init`.
- `playground/`: private local demo app for manual testing.
- `docs/`: private VitePress documentation site.
- `.changeset/`: versioning and release metadata.

Keep new code close to the package it belongs to. Export public core APIs from each package's `src/index.ts`; the Vue Grab Vite plugin is exported from `packages/vue-grab/src/vite.ts`.

## Build, Test, and Development Commands
Use Node `>=22.0.0` and pnpm `>=10.0.0`; the repo pins `pnpm@10.24.0`.

- `pnpm install`: install workspace dependencies.
- `pnpm dev`: run all package dev tasks through Turbo.
- `pnpm dev:playground`: run the local Vite playground.
- `pnpm docs:dev`: run the VitePress docs site.
- `pnpm build`: build all packages through Turbo.
- `pnpm test`: run all package tests through Turbo.
- `pnpm typecheck`: run workspace TypeScript checks.
- `pnpm lint`: run `oxlint` on `packages/`, `playground/`, and `docs/`.
- `pnpm lint:fix`: run `oxlint` with auto-fixes.
- `pnpm format`: auto-format with `oxfmt`.
- `pnpm format:check`: check formatting for CI.
- `pnpm version-packages`: run Changesets versioning through `.env`.
- `pnpm release`: publish packages with Changesets.

For package-only work, use filters such as:

```bash
pnpm --filter @sakana-y/vue-grab test -- --reporter=verbose
pnpm --filter @sakana-y/vue-grab-shared test
```

## Coding Style & Naming Conventions
Write TypeScript and Vue 3 with ES modules. Prefer `<script setup lang="ts">` in `.vue` files. The codebase uses semicolons, double quotes, and 2-space indentation. Keep filenames lowercase and descriptive; use `index.ts` for package entrypoints and `*.test.ts` for tests.

`GrabConfig` has nested objects (`filter`, `floatingButton`, `consoleCapture`, `networkCapture`, `magnifier`, `measurer`), so always use `mergeConfig()` from `@sakana-y/vue-grab-shared` for config overrides instead of object spread. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.

For floating button config, `floatingButton.dockEntries` controls toolbar order/visibility, `floatingButton.shortcuts` is the current multi-feature shortcut map, and `floatingButton.hotkeyStorageKey` plus `floatingButton.measurerHotkeyStorageKey` remain for legacy hotkey migration. Position, dock mode, dock entries, shortcuts, editor choice, and outside-click close behavior each have their own localStorage keys. `networkCapture.grabSnapshot` controls recent network entries attached to `GrabResult.network`.

Run `pnpm lint`, `pnpm format:check`, and the relevant tests before opening a PR.

## Testing Guidelines
Vitest 4 is the test runner across the workspace, configured through `vitest.workspace.ts`. Browser-oriented `@sakana-y/vue-grab` tests use Playwright-backed Vitest browser tooling with Chromium, so install Chromium when needed with `npx playwright install --with-deps chromium`. `packages/cli` and `packages/shared` use Node-environment Vitest tests.

Place tests beside the package they validate, usually under `packages/*/tests/`, and name them after the feature, for example `hotkeys.test.ts`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits such as `feat:`, `fix:`, `refactor:`, and `test:`. Keep subjects imperative and specific. PRs should include a short description, linked issues when relevant, and screenshots or demo notes for playground/docs UI changes. Ensure CI passes `lint`, `format:check`, `typecheck`, `build`, and `test`.

## Release & Versioning Notes
Use Changesets for published package changes. Add a changeset for any user-facing change to `@sakana-y/vue-grab`, `@sakana-y/vue-grab-cli`, or `@sakana-y/vue-grab-shared`, since those packages are version-linked. Playground and docs are private and excluded from releases.
