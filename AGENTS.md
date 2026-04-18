# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo managed with Turborepo. Core packages live under `packages/`:

- `packages/vue-grab`: main Vue library source in `src/`, tests in `tests/`. Two entry points: `index` (core plugin) and `vite` (dev server plugin with editor/style endpoints)
- `packages/shared`: shared types and constants
- `packages/cli`: CLI entrypoint and commands
- `playground/`: local demo app for manual testing
- `docs/`: VitePress documentation
- `.changeset/`: versioning and release metadata

Keep new code close to the package it belongs to. Export public APIs from each package’s `src/index.ts`.

## Build, Test, and Development Commands
Use Node 20+ and `pnpm` 10+.

- `pnpm install`: install workspace dependencies
- `pnpm dev:playground`: run the local Vite playground
- `pnpm docs:dev`: run the VitePress docs site
- `pnpm build`: build all packages through Turbo
- `pnpm test`: run all package tests
- `pnpm typecheck`: run workspace TypeScript checks
- `pnpm lint`: run `oxlint` on `packages/`, `playground/`, and `docs/`
- `pnpm format`: auto-format with `oxfmt`

For package-only work, use filters such as `pnpm --filter @sakana-y/vue-grab test`.

## Coding Style & Naming Conventions
Write TypeScript and Vue 3 with ES modules. Prefer `<script setup lang="ts">` in `.vue` files. The codebase uses semicolons, double quotes, and 2-space indentation. Keep filenames lowercase and descriptive; use `index.ts` for package entrypoints and `*.test.ts` for tests. `GrabConfig` has nested objects (`filter`, `floatingButton`, `consoleCapture`, `magnifier`, `measurer`) — always use `mergeConfig()` from shared for config overrides instead of spread. Run `pnpm lint` and `pnpm format` before opening a PR.

## Testing Guidelines
Vitest is the test runner across the workspace, configured through `vitest.workspace.ts`. Browser-oriented library tests also use Playwright-backed Vitest browser tooling, so install Chromium when needed with `npx playwright install --with-deps chromium`. Place tests beside the package they validate, usually under `packages/*/tests/`, and name them after the feature, for example `hotkeys.test.ts`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits such as `feat:`, `fix:`, `refactor:`, and `test:`. Keep subjects imperative and specific. PRs should include a short description, linked issues when relevant, and screenshots or demo notes for playground/docs UI changes. Ensure CI passes `lint`, `format:check`, `typecheck`, `build`, and `test`.

## Release & Versioning Notes
Use Changesets for published package changes. Add a changeset for any user-facing change to `@sakana-y/vue-grab`, `@sakana-y/vue-grab-cli`, or `@sakana-y/vue-grab-shared`, since those packages are version-linked.
