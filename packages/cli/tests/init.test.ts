import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initProject } from "../src";

const tempRoots: string[] = [];
const stdinIsTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

const defaultPackageJson = {
  type: "module",
  dependencies: {
    vue: "^3.5.0",
  },
  devDependencies: {
    "@vitejs/plugin-vue": "^6.0.0",
    vite: "^8.0.0",
  },
};

const defaultMain = `import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.mount("#app");
`;

const defaultViteConfig = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
`;

async function makeProject(
  options: {
    packageJson?: Record<string, unknown>;
    main?: string | false;
    viteConfig?: string | false;
    lockfile?: string;
  } = {},
): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "vue-grab-cli-"));
  tempRoots.push(cwd);

  await mkdir(path.join(cwd, "src"), { recursive: true });
  const writes = [
    writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify(options.packageJson ?? defaultPackageJson, null, 2),
      "utf8",
    ),
  ];

  if (options.main !== false) {
    writes.push(writeFile(path.join(cwd, "src/main.ts"), options.main ?? defaultMain, "utf8"));
  }

  if (options.viteConfig !== false) {
    writes.push(
      writeFile(path.join(cwd, "vite.config.ts"), options.viteConfig ?? defaultViteConfig, "utf8"),
    );
  }

  if (options.lockfile) {
    writes.push(writeFile(path.join(cwd, options.lockfile), "", "utf8"));
  }

  await Promise.all(writes);
  return cwd;
}

async function readProjectFile(cwd: string, relativePath: string): Promise<string> {
  return readFile(path.join(cwd, relativePath), "utf8");
}

function setStdinIsTTY(isTTY: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: isTTY,
  });
}

function restoreStdinIsTTY(): void {
  if (stdinIsTtyDescriptor) {
    Object.defineProperty(process.stdin, "isTTY", stdinIsTtyDescriptor);
    return;
  }

  Reflect.deleteProperty(process.stdin, "isTTY");
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  restoreStdinIsTTY();

  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("initProject", () => {
  it("is exported as a function", () => {
    expect(typeof initProject).toBe("function");
  });

  it("plans dependency install and patches a fresh Vite Vue app", async () => {
    const cwd = await makeProject({ lockfile: "pnpm-lock.yaml" });

    const result = await initProject({ cwd, yes: true, skipInstall: true });
    const main = await readProjectFile(cwd, "src/main.ts");
    const viteConfig = await readProjectFile(cwd, "vite.config.ts");

    expect(result.supported).toBe(true);
    expect(result.applied).toBe(true);
    expect(result.install.needed).toBe(true);
    expect(result.install.command).toBe("pnpm add -D @sakana-y/vue-grab");
    expect(result.main.status).toBe("changed");
    expect(result.vite.status).toBe("changed");

    expect(main).toContain(`import { createVueGrab } from "@sakana-y/vue-grab";`);
    expect(main).toContain("if (import.meta.env.DEV)");
    expect(main).toContain("app.use(");
    expect(main).toContain("floatingButton: { enabled: true }");
    expect(main.indexOf("if (import.meta.env.DEV)")).toBeLessThan(
      main.indexOf('app.mount("#app")'),
    );

    expect(viteConfig).toContain(`import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";`);
    expect(viteConfig).toContain("plugins: [vue(), vueGrabPlugin()]");
  });

  it("reports a dry run without writing files", async () => {
    const cwd = await makeProject();
    const originalMain = await readProjectFile(cwd, "src/main.ts");
    const originalViteConfig = await readProjectFile(cwd, "vite.config.ts");

    const result = await initProject({ cwd, dryRun: true });
    const main = await readProjectFile(cwd, "src/main.ts");
    const viteConfig = await readProjectFile(cwd, "vite.config.ts");

    expect(result.dryRun).toBe(true);
    expect(result.applied).toBe(false);
    expect(result.main.status).toBe("changed");
    expect(result.vite.status).toBe("changed");
    expect(main).toBe(originalMain);
    expect(viteConfig).toBe(originalViteConfig);
    expect(vi.mocked(console.log).mock.calls.flat().join("\n")).toContain("Dry run only");
  });

  it("is idempotent when Vue Grab is already configured", async () => {
    const packageJson = {
      ...defaultPackageJson,
      devDependencies: {
        ...defaultPackageJson.devDependencies,
        "@sakana-y/vue-grab": "^0.1.0",
      },
    };
    const main = `import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);
if (import.meta.env.DEV) {
  app.use(createVueGrab({ floatingButton: { enabled: true } }));
}
app.mount("#app");
`;
    const viteConfig = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin()],
});
`;
    const cwd = await makeProject({ packageJson, main, viteConfig });

    const result = await initProject({ cwd, yes: true });

    expect(result.install.needed).toBe(false);
    expect(result.install.skipped).toBe(false);
    expect(result.main.status).toBe("unchanged");
    expect(result.vite.status).toBe("unchanged");
    expect(await readProjectFile(cwd, "src/main.ts")).toBe(main);
    expect(await readProjectFile(cwd, "vite.config.ts")).toBe(viteConfig);
  });

  it("patches the app entrypoint when only a comment mentions the package", async () => {
    const main = `import { createApp } from "vue";
import App from "./App.vue";

// migrating off @sakana-y/vue-grab in another experiment
const app = createApp(App);
app.mount("#app");
`;
    const cwd = await makeProject({ main });

    const result = await initProject({ cwd, yes: true, skipInstall: true });
    const nextMain = await readProjectFile(cwd, "src/main.ts");

    expect(result.main.status).toBe("changed");
    expect(nextMain).toContain(`import { createVueGrab } from "@sakana-y/vue-grab";`);
    expect(nextMain).toContain("createVueGrab({");
  });

  it("patches a single-line plugins array with a trailing comma", async () => {
    const viteConfig = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({ plugins: [vue(),] });
`;
    const cwd = await makeProject({ viteConfig });

    const result = await initProject({ cwd, yes: true, skipInstall: true });
    const nextViteConfig = await readProjectFile(cwd, "vite.config.ts");

    expect(result.vite.status).toBe("changed");
    expect(nextViteConfig).toContain("plugins: [vue(), vueGrabPlugin()]");
    expect(nextViteConfig).not.toContain("vue(),,");
  });

  it("does not write files for unsupported projects", async () => {
    const packageJson = {
      type: "module",
      dependencies: {
        react: "^19.0.0",
      },
      devDependencies: {
        vite: "^8.0.0",
      },
    };
    const main = `console.log("not a vue app");
`;
    const viteConfig = `export default {};
`;
    const cwd = await makeProject({ packageJson, main, viteConfig });

    const result = await initProject({ cwd, yes: true, skipInstall: true });

    expect(result.supported).toBe(false);
    expect(result.applied).toBe(false);
    expect(await readProjectFile(cwd, "src/main.ts")).toBe(main);
    expect(await readProjectFile(cwd, "vite.config.ts")).toBe(viteConfig);
  });

  it("reports a missing Vite config with a specific message", async () => {
    const cwd = await makeProject({ viteConfig: false });

    const result = await initProject({ cwd, yes: true, skipInstall: true });

    expect(result.supported).toBe(false);
    expect(result.vite.status).toBe("missing");
    expect(result.vite.message).toBe("Could not find a Vite config.");
  });

  it("reports non-interactive cancellation without applying pending changes", async () => {
    const cwd = await makeProject();
    const originalMain = await readProjectFile(cwd, "src/main.ts");
    const originalViteConfig = await readProjectFile(cwd, "vite.config.ts");
    setStdinIsTTY(false);

    const result = await initProject({ cwd, skipInstall: true });

    expect(result.supported).toBe(true);
    expect(result.applied).toBe(false);
    expect(result.cancelReason).toBe("non-interactive");
    expect(await readProjectFile(cwd, "src/main.ts")).toBe(originalMain);
    expect(await readProjectFile(cwd, "vite.config.ts")).toBe(originalViteConfig);
  });

  it.each([
    ["pnpm-lock.yaml", "pnpm add -D @sakana-y/vue-grab"],
    ["package-lock.json", "npm install -D @sakana-y/vue-grab"],
    ["yarn.lock", "yarn add -D @sakana-y/vue-grab"],
    ["bun.lock", "bun add -d @sakana-y/vue-grab"],
  ])("detects %s for install commands", async (lockfile, command) => {
    const cwd = await makeProject({ lockfile });

    const result = await initProject({ cwd, dryRun: true });

    expect(result.install.command).toBe(command);
  });

  it("refuses to patch a Vite config without a simple plugins array", async () => {
    const viteConfig = `import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173 },
});
`;
    const cwd = await makeProject({ viteConfig });

    const result = await initProject({ cwd, yes: true, skipInstall: true });

    expect(result.main.status).toBe("changed");
    expect(result.vite.status).toBe("manual");
    expect(await readProjectFile(cwd, "vite.config.ts")).toBe(viteConfig);
  });
});
