import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";
import { builtinModules } from "node:module";

const nodeExternals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
  plugins: [dts()],
  build: {
    target: "node20",
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        bin: resolve(__dirname, "src/bin.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
    },
    rolldownOptions: {
      external: nodeExternals,
    },
  },
});
