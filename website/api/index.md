# API Reference

## `createVueGrab(options?)`

Creates a Vue plugin instance.

```ts
import { createVueGrab } from "@sakana/vue-grab";

app.use(
  createVueGrab({
    highlightColor: "#4f46e5",
    showTagHint: true,
  }),
);
```

## `useGrab()`

Composable for accessing grab configuration within components.

```ts
import { useGrab } from "@sakana/vue-grab";

const { config } = useGrab();
```

## `init(options?)`

Standalone initialization for non-Vue contexts (e.g., CDN script tag).

```ts
import { init } from "@sakana/vue-grab";

init({ highlightColor: "#ef4444" });
```
