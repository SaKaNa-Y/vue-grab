import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@sakana-y/vue-grab-shared": resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  test: {
    globals: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["tests/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov", "html"],
    },
  },
});
