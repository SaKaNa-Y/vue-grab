import { defineConfig } from "vite";
import { resolve } from "node:path";
import { builtinModules } from "node:module";

const nodeExternals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
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
