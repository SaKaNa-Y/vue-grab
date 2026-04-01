# Installation

## CLI (Recommended)

```bash
npx @sakana/vue-grab-cli init
```

## Manual

```bash
pnpm add @sakana/vue-grab
```

```ts
// main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana/vue-grab";
import App from "./App.vue";

const app = createApp(App);
app.use(createVueGrab());
app.mount("#app");
```
