# Installation

## Manual Setup

```bash
pnpm add @sakana-y/vue-grab
```

```ts
// main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);
app.use(createVueGrab());
app.mount("#app");
```

## CLI

For Vite + Vue projects, the CLI can install Vue Grab and wire the runtime plugin plus the Vite editor companion. The generated runtime setup is development-only and enables the floating button by default.

```bash
npx @sakana-y/vue-grab-cli init
```

Use `--dry-run` to preview the planned changes, or `--skip-install` if you want to install dependencies yourself.
