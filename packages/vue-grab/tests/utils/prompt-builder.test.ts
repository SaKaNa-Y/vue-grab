import { describe, it, expect } from "vitest";
import type { CapturedError } from "@sakana-y/vue-grab-shared";
import { buildErrorPrompt } from "../../src/utils/prompt-builder";

function makeError(overrides: Partial<CapturedError> = {}): CapturedError {
  return {
    id: 1,
    type: "console.error",
    message: "test error",
    count: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("buildErrorPrompt", () => {
  it("includes type and message header", () => {
    const result = buildErrorPrompt(makeError());
    expect(result).toContain("[console.error] test error");
  });

  it("includes stack trace in fenced code block when present", () => {
    const result = buildErrorPrompt(makeError({ stack: "Error: boom\n  at foo.ts:1" }));
    expect(result).toContain("```\nError: boom\n  at foo.ts:1\n```");
  });

  it("omits stack section when stack is undefined", () => {
    const result = buildErrorPrompt(makeError({ stack: undefined }));
    expect(result).not.toContain("```");
  });

  it("includes Vue lifecycle info when vueInfo is present", () => {
    const result = buildErrorPrompt(makeError({ vueInfo: "mounted hook" }));
    expect(result).toContain("Vue lifecycle: mounted hook");
  });

  it("omits vueInfo section when not present", () => {
    const result = buildErrorPrompt(makeError());
    expect(result).not.toContain("Vue lifecycle");
  });

  it("includes component stack with file paths and lines", () => {
    const result = buildErrorPrompt(
      makeError({
        componentStack: [{ name: "App", filePath: "App.vue", line: 10 }],
      }),
    );
    expect(result).toContain("- App (App.vue:10)");
  });

  it("includes component stack entry without filePath", () => {
    const result = buildErrorPrompt(makeError({ componentStack: [{ name: "App" }] }));
    expect(result).toContain("- App\n");
    expect(result).not.toContain("(");
  });

  it("includes component with filePath but no line", () => {
    const result = buildErrorPrompt(
      makeError({ componentStack: [{ name: "App", filePath: "App.vue" }] }),
    );
    expect(result).toContain("- App (App.vue)");
    expect(result).not.toContain("App.vue:");
  });

  it("omits component stack section when empty array", () => {
    const result = buildErrorPrompt(makeError({ componentStack: [] }));
    expect(result).not.toContain("Component stack");
  });

  it("includes source file and line when present", () => {
    const result = buildErrorPrompt(makeError({ sourceFile: "main.ts", sourceLine: 42 }));
    expect(result).toContain("Source: main.ts:42");
  });

  it("includes source file without line", () => {
    const result = buildErrorPrompt(makeError({ sourceFile: "main.ts" }));
    expect(result).toContain("Source: main.ts");
    expect(result).not.toContain("main.ts:");
  });

  it("builds full prompt with all sections", () => {
    const result = buildErrorPrompt(
      makeError({
        type: "vue",
        message: "Cannot read property",
        stack: "Error: Cannot read property\n  at Comp.vue:5",
        vueInfo: "setup function",
        componentStack: [{ name: "MyComp", filePath: "MyComp.vue", line: 5 }],
        sourceFile: "MyComp.vue",
        sourceLine: 5,
      }),
    );
    expect(result).toContain("[vue] Cannot read property");
    expect(result).toContain("```");
    expect(result).toContain("Vue lifecycle: setup function");
    expect(result).toContain("- MyComp (MyComp.vue:5)");
    expect(result).toContain("Source: MyComp.vue:5");
  });
});
