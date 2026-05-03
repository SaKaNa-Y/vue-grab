# Vue Grab

[![npm version](https://img.shields.io/npm/v/@sakana-y/vue-grab)](https://www.npmjs.com/package/@sakana-y/vue-grab)
[![CI](https://github.com/SaKaNa-Y/vue-grab/actions/workflows/ci.yml/badge.svg)](https://github.com/SaKaNa-Y/vue-grab/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/SaKaNa-Y/vue-grab)](./LICENSE)

Grab UI context from Vue apps for AI coding agents.

Point at any element, click, and capture its HTML, CSS selector, Vue component hierarchy, accessibility context, and recent network activity so you can hand useful UI evidence to Cursor, Claude Code, or any AI chat.

## Features

- **Interactive element selection** - hover to highlight, click to capture.
- **Vue component stack** - extracts component names, file paths, and source lines when Vue or related capture utilities expose them.
- **CSS selector generation** - creates a useful locator for the selected element.
- **HTML capture** - records `outerHTML` with configurable truncation.
- **Accessibility audit** - extracts ARIA/a11y attributes on every grab and provides a page-wide scan from the floating button.
- **Console capture** - records console output, runtime errors, promise rejections, and Vue errors in a searchable ring buffer.
- **Network capture** - records `fetch`/XHR metadata, redacts sensitive headers, optionally captures bodies, and attaches recent requests to grab results.
- **Floating action button** - optional draggable toolbar with Float and Edge dock modes, settings, logs, network, a11y, magnifier, and measurer controls.
- **Magnifier and measurer** - inspect zoomed HTML context and measure distances between elements while iterating on UI.
- **Vite editor integration** - open captured file paths in your editor through the companion dev-server plugin.
- **Shadow DOM isolation** - overlay and toolbar styles stay isolated from your app.
- **Works with or without Vue** - use as a Vue plugin or standalone `init()`.

## Quick Start

For a Vite + Vue app, the CLI can install Vue Grab and wire both the runtime plugin and the Vite editor companion:

```bash
npx @sakana-y/vue-grab-cli init
```

Use `--dry-run` to preview changes, `--yes` to skip prompts, or `--skip-install` if you want to install dependencies yourself.

### Manual Vue Plugin Setup

```bash
pnpm add -D @sakana-y/vue-grab
```

```ts
// main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);
app.use(
  createVueGrab({
    floatingButton: { enabled: true },
  }),
);
app.mount("#app");
```

Then use the composable in any component:

```vue
<script setup lang="ts">
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, lastResult, toggle } = useGrab();
</script>

<template>
  <button @click="toggle">
    {{ isActive ? "Grabbing..." : "Grab" }}
  </button>
  <pre v-if="lastResult">{{ lastResult.selector }}</pre>
</template>
```

### Vite Editor Integration

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin({ editor: "code" })],
});
```

The Vite plugin adds a development-only `/__open-in-editor` endpoint for same-origin JSON `POST` requests. It rejects paths outside the project root and unsupported editor commands.

### Standalone Usage

```ts
import { init } from "@sakana-y/vue-grab";

const grabber = init({ floatingButton: { enabled: true } });

grabber.onGrab((result) => {
  console.log(result.selector);
  console.log(result.html);
  console.log(result.componentStack);
  console.log(result.a11y);
  console.log(result.network);
});

grabber.onLog((entries) => console.table(entries));
grabber.onNetwork((entries) => console.table(entries));

// later
grabber.clearLogs();
grabber.clearNetwork();
grabber.destroy();
```

## Configuration

All options are optional. Pass them to `createVueGrab()` or `init()`:

```ts
createVueGrab({
  highlightColor: "#4f46e5",
  labelTextColor: "#ffffff",
  showTagHint: true,
  maxHtmlLength: 10000,
  filter: {
    ignoreSelectors: [],
    ignoreTags: [],
    skipCommonComponents: false,
  },
  floatingButton: {
    enabled: false,
    initialPosition: "top-center",
    dockMode: "float",
    storageKey: "vue-grab-fab-pos",
    dockModeStorageKey: "vue-grab-dock-mode",
    hotkeyStorageKey: "vue-grab-hotkey",
    editorStorageKey: "vue-grab-editor",
    measurerHotkeyStorageKey: "vue-grab-measurer-hotkey",
    closeOnOutsideClick: true,
    closeOnOutsideClickStorageKey: "vue-grab-close-on-outside-click",
  },
  consoleCapture: {
    enabled: true,
    maxEntries: 200,
    levels: ["log", "info", "warn", "error", "debug"],
    captureUnhandled: true,
    captureVueErrors: true,
  },
  networkCapture: {
    enabled: true,
    maxEntries: 100,
    captureFetch: true,
    captureXhr: true,
    captureBodies: false,
    bodyMaxBytes: 2048,
    redactHeaders: ["authorization", "cookie", "set-cookie", "x-api-key"],
    urlDenyList: ["/__open-in-editor"],
    grabSnapshot: {
      enabled: true,
      maxEntries: 20,
      windowMs: 10000,
    },
  },
  magnifier: {
    enabled: true,
    loupeSize: 400,
    zoomLevel: 3,
    showHtmlOverlay: true,
    maxOverlayHtmlLength: 200,
  },
  measurer: {
    enabled: true,
    lineColor: "#06b6d4",
    guideColor: "#a855f7",
    lineWidth: 1,
    showAlignmentGuides: true,
    alignmentTolerance: 3,
  },
});
```

Nested options are deep-merged with `DEFAULT_CONFIG` by `mergeConfig()` from `@sakana-y/vue-grab-shared`. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.

## `useGrab()` API

| Property             | Type                                    | Description                       |
| -------------------- | --------------------------------------- | --------------------------------- |
| `config`             | `GrabConfig`                            | Resolved configuration            |
| `isActive`           | `Readonly<Ref<boolean>>`                | Whether grab mode is active       |
| `lastResult`         | `DeepReadonly<Ref<GrabResult \| null>>` | Last captured result              |
| `isMeasurerActive`   | `Readonly<Ref<boolean>>`                | Whether measurer mode is active   |
| `activate()`         | `() => void`                            | Enter grab mode                   |
| `deactivate()`       | `() => void`                            | Exit grab mode                    |
| `toggle()`           | `() => void`                            | Toggle grab mode                  |
| `toggleMeasurer()`   | `() => void`                            | Toggle the element measurer       |

### `GrabResult`

```ts
interface GrabResult {
  element: Element;
  html: string;
  componentStack: ComponentInfo[];
  selector: string;
  a11y: A11yInfo;
  network?: CapturedRequest[];
}

interface ComponentInfo {
  name: string;
  filePath?: string;
  line?: number;
}

interface A11yInfo {
  attributes: A11yAttribute[];
  audit: A11yAuditItem[];
  hasA11y: boolean;
}
```

## Packages

| Package                                          | Description                                      |
| ------------------------------------------------ | ------------------------------------------------ |
| [`@sakana-y/vue-grab`](./packages/vue-grab)      | Core library, Vue plugin, composable, and engine |
| [`@sakana-y/vue-grab-shared`](./packages/shared) | Shared types, defaults, merge helpers, protocol  |
| [`@sakana-y/vue-grab-cli`](./packages/cli)       | CLI tool (`vue-grab init`)                       |

## Development

```bash
pnpm install
pnpm dev:playground
pnpm docs:dev
pnpm test
pnpm build
pnpm lint && pnpm format:check
```

## License

[MIT](./LICENSE)
