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

The CLI is available for project scaffolding experiments, but the manual setup above is the recommended path for now.

```bash
npx @sakana-y/vue-grab-cli init
```
