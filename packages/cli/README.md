# Vue Grab CLI

[![npm version](https://img.shields.io/npm/v/@sakana-y/vue-grab-cli)](https://www.npmjs.com/package/@sakana-y/vue-grab-cli)
[![license](https://img.shields.io/npm/l/@sakana-y/vue-grab-cli)](./LICENSE)

CLI setup tool for adding Vue Grab to Vite and Vue projects.

`vue-grab init` installs `@sakana-y/vue-grab`, wires the Vue runtime plugin into your app entry, and adds the Vite editor companion plugin when it can safely update your project.

## Usage

```bash
npx @sakana-y/vue-grab-cli init
```

Preview the planned changes without editing files:

```bash
npx @sakana-y/vue-grab-cli init --dry-run
```

Run non-interactively:

```bash
npx @sakana-y/vue-grab-cli init --yes
```

Skip dependency installation when you want to manage dependencies yourself:

```bash
npx @sakana-y/vue-grab-cli init --skip-install
```

## What It Does

- Detects the package manager from lockfiles.
- Adds `@sakana-y/vue-grab` as a development dependency.
- Updates the Vue app entry to install `createVueGrab()`.
- Updates Vite config to use `vueGrabPlugin()` from `@sakana-y/vue-grab/vite`.
- Avoids duplicate setup when Vue Grab is already configured.
- Supports dry-run output before any file edits.

## Supported Package Managers

- pnpm
- npm
- yarn
- bun

## Related Packages

- `@sakana-y/vue-grab`: Vue plugin, runtime APIs, and Vite integration.
- `@sakana-y/vue-grab-shared`: Shared types, defaults, config merging, and protocol constants.

## Links

- Repository: https://github.com/SaKaNa-Y/vue-grab
- Issues: https://github.com/SaKaNa-Y/vue-grab/issues
- Changelog: ./CHANGELOG.md
- License: ./LICENSE
