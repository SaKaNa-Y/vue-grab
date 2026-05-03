# Installation

## CLI Setup

For Vite + Vue projects, the CLI can install Vue Grab and wire both the runtime plugin and Vite editor companion. The generated runtime setup is development-only and enables the floating button by default.

```bash
npx @sakana-y/vue-grab-cli init
```

Common flags:

| Flag             | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `--yes`, `-y`    | Skip prompts and apply detected changes.                           |
| `--dry-run`      | Show planned changes without writing files or installing packages. |
| `--skip-install` | Update source files but leave dependency installation to you.      |

The CLI currently supports projects with a readable `package.json`, Vue and Vite dependencies, an app entrypoint at `src/main.ts` or `src/main.js`, and a standard Vite config file.

## Manual Runtime Setup

```bash
pnpm add -D @sakana-y/vue-grab
```

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

## Vite Editor Companion

Add the companion plugin when you want captured file paths to open in your editor:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin()],
});
```

You can pass a default editor command:

```ts
vueGrabPlugin({ editor: "code" });
```

Next: **[Quick Start](./quick-start)**
