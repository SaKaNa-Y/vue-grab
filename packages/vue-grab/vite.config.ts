import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VueGrab",
      formats: ["es", "cjs", "umd"],
      fileName: (format) =>
        `index.${format === "es" ? "mjs" : format === "cjs" ? "cjs" : "umd.js"}`,
    },
    rolldownOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
