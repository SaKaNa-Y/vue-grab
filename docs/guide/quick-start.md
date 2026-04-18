# Quick Start

The shortest path from a clean Vite + Vue project to a working Vue Grab setup.

## 1. Install

```bash
pnpm add -D @sakana-y/vue-grab
```

## 2. Register the plugin

```ts
// src/main.ts
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

That's it for the runtime side. Reload your app — press `Alt+Shift+G`, hover, click. The component stack and file paths appear in `useGrab().lastResult`.

## 3. (Optional) Wire up the Vite plugin

Add the Vite companion so clicking a file path in a grab result opens your editor:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin()],
});
```

## 4. Use the result

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

## 5. Feed it to your agent

The `lastResult` object is JSON-serializable. Pipe it into a chat prompt, a clipboard copy, or a file — whatever your agent accepts.

---

Next up: **[Configuration →](./configuration)** walks through every option, or dive straight into **[Features →](../features/grab)**.
