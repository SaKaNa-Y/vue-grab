# Vue Grab

[![npm version](https://img.shields.io/npm/v/@sakana-y/vue-grab)](https://www.npmjs.com/package/@sakana-y/vue-grab)
[![license](https://img.shields.io/npm/l/@sakana-y/vue-grab)](./LICENSE)

Grab UI context from Vue apps for AI coding agents.

Point at any element, click, and capture its HTML, CSS selector, Vue component hierarchy, accessibility context, console output, and recent network activity so you can hand useful UI evidence to Cursor, Claude Code, or any AI chat.

## Features

- Interactive element selection with hover highlighting.
- Vue component stack extraction when Vue exposes file and line metadata.
- CSS selector and HTML capture with configurable limits.
- Accessibility attributes and page-wide audit helpers.
- Console capture for logs, warnings, errors, unhandled rejections, and Vue errors.
- Network capture for `fetch` and XHR metadata with header redaction and optional body capture.
- Render Scan heatmap for frequently updating Vue components.
- Floating action button with settings, logs, network, a11y, magnifier, and measurer tools.
- Vite editor integration through the `@sakana-y/vue-grab/vite` entry point.
- Shadow DOM isolation for Vue Grab overlays and toolbar styles.
- Vue plugin and standalone runtime APIs.

## Install

```bash
pnpm add -D @sakana-y/vue-grab
```

You can also use the setup CLI:

```bash
npx @sakana-y/vue-grab-cli init
```

## Vue Plugin Setup

```ts
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

Use the composable anywhere in your Vue app:

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

## Vite Editor Integration

Add the companion Vite plugin when you want captured source paths to open in your editor during development:

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin({ editor: "code" })],
});
```

The plugin adds a development-only endpoint for same-origin editor requests. It rejects paths outside the project root and unsupported editor commands.

## Standalone Usage

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

grabber.destroy();
```

## Core APIs

- `createVueGrab(config?)`: Vue plugin factory.
- `useGrab()`: composable for grab state, results, and controls.
- `init(config?)`: standalone runtime initializer.
- `openInEditor(request)`: sends a dev-server editor request.
- `@sakana-y/vue-grab/vite`: Vite dev-server plugin entry point.

Configuration objects are deep-merged with the default config by `mergeConfig()` from `@sakana-y/vue-grab-shared`. Array fields such as `consoleCapture.levels`, `networkCapture.redactHeaders`, and `networkCapture.urlDenyList` are replaced wholesale.

## Links

- Repository: https://github.com/SaKaNa-Y/vue-grab
- Issues: https://github.com/SaKaNa-Y/vue-grab/issues
- Changelog: ./CHANGELOG.md
- License: ./LICENSE
