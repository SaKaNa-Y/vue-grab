# Quick Start

The shortest path from a clean Vite + Vue project to a working Vue Grab setup is the CLI:

```bash
npx @sakana-y/vue-grab-cli init
```

Use `npx @sakana-y/vue-grab-cli init --dry-run` to inspect the planned file edits first. Add `--yes` for non-interactive setup, or `--skip-install` if you want to manage dependencies yourself.

## Manual setup

Install the runtime package:

```bash
pnpm add -D @sakana-y/vue-grab
```

Register the Vue plugin:

```ts
// src/main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);

if (import.meta.env.DEV) {
  app.use(
    createVueGrab({
      floatingButton: { enabled: true },
    }),
  );
}

app.mount("#app");
```

Reload your app, press `Alt+Shift+G`, hover an element, and click. The component stack, selector, HTML, a11y info, and optional network snapshot appear in `useGrab().lastResult`.

## Optional Vite editor setup

Add the Vite companion so clicking a file path can open your editor:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin({ editor: "code" })],
});
```

## Use the result

```vue
<!-- Any component -->
<script setup lang="ts">
import { useGrab, openInEditor } from "@sakana-y/vue-grab";

const { isActive, lastResult, toggle } = useGrab();
</script>

<template>
  <button @click="toggle">{{ isActive ? "Cancel" : "Grab" }}</button>

  <pre v-if="lastResult">{{ lastResult.selector }}</pre>

  <button
    v-if="lastResult?.componentStack[0]?.filePath"
    @click="openInEditor(lastResult.componentStack[0].filePath!, lastResult.componentStack[0].line)"
  >
    Open in editor
  </button>
</template>
```

`lastResult` contains a raw DOM element, so pass a serializable subset such as `selector`, `html`, `componentStack`, `a11y`, and `network` into a chat prompt, clipboard copy, or file.

Next: **[Configuration](./configuration)** walks through every option, or dive straight into **[Features](../features/grab)**.
