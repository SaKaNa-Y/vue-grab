import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        vite: resolve(__dirname, "src/vite.ts"),
      },
      name: "VueGrab",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
    },
    rolldownOptions: {
      external: ["vue", "vite", "launch-editor", "postcss", "@vue/compiler-sfc"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
