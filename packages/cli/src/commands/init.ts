import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import pc from "picocolors";

const PACKAGE_NAME = "@sakana-y/vue-grab";
const MAIN_CANDIDATES = ["src/main.ts", "src/main.js"];
const VITE_CONFIG_CANDIDATES = [
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.js",
  "vite.config.mjs",
];

export interface InitOptions {
  yes?: boolean;
  dryRun?: boolean;
  skipInstall?: boolean;
  /** Test-only override. Defaults to process.cwd(). */
  cwd?: string;
}

export type InitStepStatus = "changed" | "unchanged" | "manual" | "missing";
export type InitCancelReason = "non-interactive" | "prompt-declined";

export interface InitFileStep {
  path?: string;
  status: InitStepStatus;
  message: string;
}

export interface InitInstallStep {
  needed: boolean;
  skipped: boolean;
  packageManager: PackageManager;
  command: string;
}

export interface InitResult {
  cwd: string;
  supported: boolean;
  packageManager: PackageManager;
  install: InitInstallStep;
  main: InitFileStep;
  vite: InitFileStep;
  applied: boolean;
  dryRun: boolean;
  cancelReason?: InitCancelReason;
}

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface FileChange {
  path: string;
  content: string;
}

interface FileHit {
  relativePath: string;
  content: string;
}

interface TransformResult {
  status: InitStepStatus;
  content?: string;
  message: string;
}

function hasDependency(pkg: PackageJson, name: string): boolean {
  return Boolean(
    pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name],
  );
}

async function detectPackageManager(cwd: string): Promise<PackageManager> {
  const lockfiles: Array<[string, PackageManager]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["package-lock.json", "npm"],
    ["npm-shrinkwrap.json", "npm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
  ];
  const results = await Promise.all(
    lockfiles.map(([file]) =>
      access(path.join(cwd, file)).then(
        () => true,
        () => false,
      ),
    ),
  );
  const hit = lockfiles.find((_, index) => results[index]);
  return hit?.[1] ?? "npm";
}

function getInstallCommand(packageManager: PackageManager): { command: string; args: string[] } {
  switch (packageManager) {
    case "pnpm":
      return { command: "pnpm", args: ["add", "-D", PACKAGE_NAME] };
    case "yarn":
      return { command: "yarn", args: ["add", "-D", PACKAGE_NAME] };
    case "bun":
      return { command: "bun", args: ["add", "-d", PACKAGE_NAME] };
    case "npm":
      return { command: "npm", args: ["install", "-D", PACKAGE_NAME] };
  }
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].join(" ");
}

async function findAndReadFirst(
  cwd: string,
  candidates: readonly string[],
): Promise<FileHit | undefined> {
  async function readCandidate(index: number): Promise<FileHit | undefined> {
    const candidate = candidates[index];
    if (candidate === undefined) return undefined;

    try {
      const content = await readFile(path.join(cwd, candidate), "utf8");
      return { relativePath: candidate, content };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }

      return readCandidate(index + 1);
    }
  }

  return readCandidate(0);
}

function detectEol(source: string): "\r\n" | "\n" {
  return source.includes("\r\n") ? "\r\n" : "\n";
}

function toSourceEol(source: string, text: string): string {
  return text.replace(/\n/g, detectEol(source));
}

function insertImport(source: string, importLine: string): string {
  const eol = detectEol(source);
  const lines = source.split(/\r?\n/);
  let insertAt = 0;

  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*import\s/.test(lines[i])) {
      insertAt = i + 1;
    }
  }

  lines.splice(insertAt, 0, importLine);
  return lines.join(eol);
}

function transformMain(source: string): TransformResult {
  if (/createVueGrab\s*\(/.test(source)) {
    return {
      status: "unchanged",
      message: "Vue Grab runtime setup already exists in the app entrypoint.",
    };
  }

  const appMatch = source.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*createApp\s*\(/);
  if (!appMatch) {
    return {
      status: "manual",
      message: "Could not find a simple createApp() assignment.",
    };
  }

  const appName = appMatch[1];
  const escapedAppName = appName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mountPattern = new RegExp(`(^[ \\t]*)${escapedAppName}\\.mount\\s*\\(`, "m");
  const mountMatch = source.match(mountPattern);
  if (!mountMatch || mountMatch.index == null) {
    return {
      status: "manual",
      message: `Could not find ${appName}.mount(...) in the app entrypoint.`,
    };
  }

  let nextSource = insertImport(source, `import { createVueGrab } from "${PACKAGE_NAME}";`);
  const updatedMountMatch = nextSource.match(mountPattern);
  if (!updatedMountMatch || updatedMountMatch.index == null) {
    return {
      status: "manual",
      message: `Could not find ${appName}.mount(...) after import insertion.`,
    };
  }

  const indent = updatedMountMatch[1] ?? "";
  const setupBlock = toSourceEol(
    nextSource,
    `${indent}if (import.meta.env.DEV) {
${indent}  ${appName}.use(
${indent}    createVueGrab({
${indent}      floatingButton: { enabled: true },
${indent}    }),
${indent}  );
${indent}}

`,
  );

  nextSource =
    nextSource.slice(0, updatedMountMatch.index) +
    setupBlock +
    nextSource.slice(updatedMountMatch.index);

  return {
    status: "changed",
    content: nextSource,
    message: "Added dev-only createVueGrab() setup.",
  };
}

function findMatchingBracket(source: string, openIndex: number): number | undefined {
  let depth = 0;
  let quote: "'" | '"' | "`" | undefined;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (char === quote && prev !== "\\") quote = undefined;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return undefined;
}

function getLineIndentBefore(source: string, index: number): string {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const line = source.slice(lineStart, index);
  return line.match(/^[ \t]*/)?.[0] ?? "";
}

function addPluginToArray(source: string, openIndex: number, closeIndex: number): string {
  const eol = detectEol(source);
  const inner = source.slice(openIndex + 1, closeIndex);

  if (!inner.includes("\n") && !inner.includes("\r")) {
    const trimmed = inner.trim();
    const cleaned = trimmed.replace(/,\s*$/, "");
    const replacement = cleaned ? `${cleaned}, vueGrabPlugin()` : "vueGrabPlugin()";
    return source.slice(0, openIndex + 1) + replacement + source.slice(closeIndex);
  }

  const beforeClose = source.slice(0, closeIndex).replace(/\s*$/, "");
  const trailingWhitespace = source.slice(beforeClose.length, closeIndex);
  const needsComma = beforeClose.endsWith("[") || beforeClose.endsWith(",") ? "" : ",";
  const closingIndent = getLineIndentBefore(source, closeIndex);
  const itemIndent = `${closingIndent}  `;

  return (
    beforeClose +
    needsComma +
    eol +
    itemIndent +
    "vueGrabPlugin()," +
    trailingWhitespace +
    source.slice(closeIndex)
  );
}

function transformViteConfig(source: string): TransformResult {
  if (/vueGrabPlugin\s*\(/.test(source) || source.includes(`${PACKAGE_NAME}/vite`)) {
    return {
      status: "unchanged",
      message: "Vue Grab Vite plugin already exists.",
    };
  }

  const pluginsMatch = source.match(/\bplugins\s*:\s*\[/);
  if (!pluginsMatch || pluginsMatch.index == null) {
    return {
      status: "manual",
      message: "Could not find a simple Vite plugins array.",
    };
  }

  const openIndex = source.indexOf("[", pluginsMatch.index);
  const closeIndex = findMatchingBracket(source, openIndex);
  if (closeIndex == null) {
    return {
      status: "manual",
      message: "Could not find the end of the Vite plugins array.",
    };
  }

  const withPlugin = addPluginToArray(source, openIndex, closeIndex);
  const nextSource = insertImport(
    withPlugin,
    `import { vueGrabPlugin } from "${PACKAGE_NAME}/vite";`,
  );

  return {
    status: "changed",
    content: nextSource,
    message: "Added vueGrabPlugin() to Vite dev server config.",
  };
}

function printManualInstructions(main: InitFileStep, vite: InitFileStep): void {
  const manualInstructions = [
    {
      needed: main.status === "manual" || main.status === "missing",
      label: "Manual app setup needed:",
      lines: [
        `  import { createVueGrab } from "${PACKAGE_NAME}";`,
        "  if (import.meta.env.DEV) app.use(createVueGrab({ floatingButton: { enabled: true } }));",
      ],
    },
    {
      needed: vite.status === "manual" || vite.status === "missing",
      label: "Manual Vite setup needed:",
      lines: [
        `  import { vueGrabPlugin } from "${PACKAGE_NAME}/vite";`,
        "  plugins: [vue(), vueGrabPlugin()]",
      ],
    },
  ];

  for (const instruction of manualInstructions) {
    if (!instruction.needed) continue;
    console.log(pc.yellow(instruction.label));
    for (const line of instruction.lines) {
      console.log(line);
    }
  }
}

async function confirmApply(): Promise<InitCancelReason | undefined> {
  if (!process.stdin.isTTY) {
    console.log(
      pc.yellow("Non-interactive terminal detected. Re-run with --yes to apply changes."),
    );
    return "non-interactive";
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Apply these changes? (Y/n) ");
    return /^n(o)?$/i.test(answer.trim()) ? "prompt-declined" : undefined;
  } finally {
    rl.close();
  }
}

async function runInstall(cwd: string, command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${formatCommand(command, args)} exited with code ${code}`));
    });
  });
}

async function readPackageJson(cwd: string): Promise<PackageJson | undefined> {
  try {
    return JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8")) as PackageJson;
  } catch {
    return undefined;
  }
}

function makeFileStep(
  relativePath: string | undefined,
  transform: TransformResult | undefined,
  missingMessage: string,
): InitFileStep {
  if (!relativePath || !transform) {
    return { status: "missing", message: missingMessage };
  }

  return {
    path: relativePath,
    status: transform.status,
    message: transform.message,
  };
}

function makeUnsupportedStep(
  relativePath: string | undefined,
  packageJson: PackageJson | undefined,
  missingMessage: string,
  unsupportedMessage: string,
): InitFileStep {
  if (!packageJson) {
    return {
      path: relativePath,
      status: relativePath ? "manual" : "missing",
      message: "Could not read package.json.",
    };
  }

  if (!relativePath) {
    return {
      status: "missing",
      message: missingMessage,
    };
  }

  return {
    path: relativePath,
    status: "manual",
    message: unsupportedMessage,
  };
}

const stepStatusColor: Record<InitStepStatus, (value: string) => string> = {
  changed: pc.green,
  unchanged: pc.cyan,
  manual: pc.yellow,
  missing: pc.yellow,
};

function printStep(label: string, step: InitFileStep): void {
  const target = step.path ? ` ${pc.dim(step.path)}` : "";
  const color = stepStatusColor[step.status];
  console.log(`${color(step.status.padEnd(9))} ${label}${target} - ${step.message}`);
}

export async function initProject(options: InitOptions = {}): Promise<InitResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const [packageManager, packageJson, mainHit, viteHit] = await Promise.all([
    detectPackageManager(cwd),
    readPackageJson(cwd),
    findAndReadFirst(cwd, MAIN_CANDIDATES),
    findAndReadFirst(cwd, VITE_CONFIG_CANDIDATES),
  ]);
  const installCommand = getInstallCommand(packageManager);
  const hasVue = packageJson ? hasDependency(packageJson, "vue") : false;
  const hasVite = packageJson ? hasDependency(packageJson, "vite") : false;
  const hasVueGrab = packageJson ? hasDependency(packageJson, PACKAGE_NAME) : false;
  const mainPath = mainHit?.relativePath;
  const vitePath = viteHit?.relativePath;
  const supported = Boolean(packageJson && hasVue && hasVite && mainPath && vitePath);

  console.log(pc.cyan("vue-grab") + " - Initializing...");

  const installNeeded = !hasVueGrab;
  const install: InitInstallStep = {
    needed: installNeeded,
    skipped: installNeeded && (Boolean(options.skipInstall) || Boolean(options.dryRun)),
    packageManager,
    command: formatCommand(installCommand.command, installCommand.args),
  };

  if (!supported) {
    const result: InitResult = {
      cwd,
      supported: false,
      packageManager,
      install,
      main: makeUnsupportedStep(
        mainPath,
        packageJson,
        "Could not find src/main.ts or src/main.js.",
        "This does not look like a supported Vite + Vue app entrypoint.",
      ),
      vite: makeUnsupportedStep(
        vitePath,
        packageJson,
        "Could not find a Vite config.",
        "This does not look like a supported Vite + Vue config.",
      ),
      applied: false,
      dryRun: Boolean(options.dryRun),
    };

    console.log(
      pc.yellow("Unsupported project shape. Vue Grab init currently supports Vite + Vue apps."),
    );
    printManualInstructions(result.main, result.vite);
    return result;
  }

  if (!mainPath || !vitePath || !mainHit || !viteHit) {
    throw new Error("Internal: supported project missing entrypoint paths.");
  }

  const changes: FileChange[] = [];
  const mainTransform = transformMain(mainHit.content);
  const viteTransform = transformViteConfig(viteHit.content);
  const main = makeFileStep(mainPath, mainTransform, "Could not find src/main.ts or src/main.js.");
  const vite = makeFileStep(vitePath, viteTransform, "Could not find a Vite config.");

  if (mainTransform.status === "changed" && mainTransform.content != null) {
    changes.push({ path: mainPath, content: mainTransform.content });
  }
  if (viteTransform.status === "changed" && viteTransform.content != null) {
    changes.push({ path: vitePath, content: viteTransform.content });
  }

  if (install.needed) {
    const suffix = install.skipped ? "planned" : "will run";
    console.log(`${pc.green("install  ")} ${install.command} (${suffix})`);
  } else {
    console.log(`${pc.cyan("unchanged")} ${PACKAGE_NAME} already installed.`);
  }
  printStep("entry", main);
  printStep("vite", vite);
  printManualInstructions(main, vite);

  const result: InitResult = {
    cwd,
    supported: true,
    packageManager,
    install,
    main,
    vite,
    applied: false,
    dryRun: Boolean(options.dryRun),
  };

  if (options.dryRun) {
    console.log(pc.yellow("Dry run only. No files were changed and no packages were installed."));
    return result;
  }

  if (!options.yes) {
    const cancelReason = await confirmApply();
    if (cancelReason) {
      result.cancelReason = cancelReason;
      console.log(pc.yellow("Canceled."));
      return result;
    }
  }

  await Promise.all(
    changes.map((change) => writeFile(path.join(cwd, change.path), change.content, "utf8")),
  );

  if (install.needed && !options.skipInstall) {
    await runInstall(cwd, installCommand.command, installCommand.args);
  } else if (install.needed && options.skipInstall) {
    console.log(pc.yellow(`Skipped install. Run ${install.command} when you are ready.`));
  }

  result.applied = true;
  console.log(pc.green("Done!"));
  return result;
}
