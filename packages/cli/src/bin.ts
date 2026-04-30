#!/usr/bin/env node
import { cac } from "cac";
import { version } from "../package.json";

const cli = cac("vue-grab");

cli
  .command("init", "Initialize vue-grab in your project")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("--dry-run", "Show the planned changes without writing files or installing packages")
  .option("--skip-install", "Do not install @sakana-y/vue-grab")
  .action(async (options) => {
    try {
      const { initProject } = await import("./commands/init");
      const result = await initProject(options);
      const pending =
        result.main.status === "changed" ||
        result.vite.status === "changed" ||
        (result.install.needed && !result.install.skipped);

      if (result.cancelReason === "non-interactive" && pending) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    }
  });

cli.help();
cli.version(version);
cli.parse();
