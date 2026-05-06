# Vue Grab Shared

[![npm version](https://img.shields.io/npm/v/@sakana-y/vue-grab-shared)](https://www.npmjs.com/package/@sakana-y/vue-grab-shared)
[![license](https://img.shields.io/npm/l/@sakana-y/vue-grab-shared)](./LICENSE)

Shared types, defaults, config merging, and protocol constants for Vue Grab integrations.

Most applications should import from `@sakana-y/vue-grab`. Use this package when you are building tooling, tests, or integrations that need stable Vue Grab contracts without importing the Vue runtime.

## Install

```bash
pnpm add -D @sakana-y/vue-grab-shared
```

## Exports

```ts
import {
  DEFAULT_CONFIG,
  DEFAULT_FLOATING_BUTTON,
  OPEN_IN_EDITOR_CONTENT_TYPE,
  OPEN_IN_EDITOR_ENDPOINT,
  VUE_ERROR_EVENT,
  mergeConfig,
} from "@sakana-y/vue-grab-shared";

import type {
  CapturedLog,
  CapturedRequest,
  ComponentInfo,
  GrabConfig,
  GrabResult,
  GrabUserConfig,
  OpenInEditorRequest,
} from "@sakana-y/vue-grab-shared";
```

## Configuration Merging

Use `mergeConfig()` whenever you combine user config with defaults:

```ts
import { DEFAULT_CONFIG, mergeConfig } from "@sakana-y/vue-grab-shared";

const config = mergeConfig(DEFAULT_CONFIG, {
  floatingButton: { enabled: true },
  networkCapture: {
    redactHeaders: ["authorization", "x-api-key"],
  },
});
```

`GrabConfig` contains nested objects, so object spread is not enough for safe overrides. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.

## Related Packages

- `@sakana-y/vue-grab`: Vue plugin, runtime APIs, and Vite integration.
- `@sakana-y/vue-grab-cli`: CLI setup tool for Vite and Vue projects.

## Links

- Repository: https://github.com/SaKaNa-Y/vue-grab
- Issues: https://github.com/SaKaNa-Y/vue-grab/issues
- Changelog: ./CHANGELOG.md
- License: ./LICENSE
