// SFC modules for plain `tsc` (which cannot parse `.vue`). Vite + @vitejs/plugin-vue
// compile the real components; this shim only lets `tsc --noEmit` resolve the imports.
// Full SFC type-checking is a follow-up (switch `typecheck` to `vue-tsc`).
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
