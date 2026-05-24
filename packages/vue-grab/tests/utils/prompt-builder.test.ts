import { describe, it, expect } from "vitest";

import type { CapturedLog, CapturedRequest, GrabResult } from "@sakana-y/vue-grab-shared";

import { buildContextPrompt, buildLogPrompt } from "../../src/utils/prompt-builder";

function makeLog(overrides: Partial<CapturedLog> = {}): CapturedLog {
  return {
    id: 1,
    level: "error",
    source: "console",
    message: "test error",
    count: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeRequest(overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    id: 1,
    method: "GET",
    url: "https://example.com/api/items",
    initiator: "fetch",
    status: 200,
    statusClass: "2xx",
    startTime: 1,
    duration: 42,
    timestamp: 1,
    count: 1,
    ...overrides,
  };
}

function makeGrabResult(overrides: Partial<GrabResult> = {}): GrabResult {
  return {
    element: document.createElement("button"),
    html: '<button aria-label="Save">Save</button>',
    componentStack: [{ name: "SaveButton", filePath: "src/SaveButton.vue", line: 12 }],
    selector: "button.save",
    a11y: {
      attributes: [{ name: "aria-label", value: "Save" }],
      audit: [{ severity: "info", message: "Button has an accessible name" }],
      hasA11y: true,
    },
    ...overrides,
  };
}

describe("buildLogPrompt", () => {
  it("omits source prefix for console entries (level only)", () => {
    const result = buildLogPrompt(makeLog());
    expect(result).toContain("[error] test error");
    expect(result).not.toContain("console/");
  });

  it("includes source/level header for non-console sources", () => {
    const result = buildLogPrompt(makeLog({ source: "runtime", message: "boom" }));
    expect(result).toContain("[runtime/error] boom");
  });

  it("includes stack trace in fenced code block when present", () => {
    const result = buildLogPrompt(makeLog({ stack: "Error: boom\n  at foo.ts:1" }));
    expect(result).toContain("```\nError: boom\n  at foo.ts:1\n```");
  });

  it("omits stack section when stack is undefined", () => {
    const result = buildLogPrompt(makeLog({ stack: undefined }));
    expect(result).not.toContain("```");
  });

  it("includes Vue lifecycle info when vueInfo is present", () => {
    const result = buildLogPrompt(makeLog({ vueInfo: "mounted hook" }));
    expect(result).toContain("Vue lifecycle: mounted hook");
  });

  it("omits vueInfo section when not present", () => {
    const result = buildLogPrompt(makeLog());
    expect(result).not.toContain("Vue lifecycle");
  });

  it("includes component stack with file paths and lines", () => {
    const result = buildLogPrompt(
      makeLog({
        componentStack: [{ name: "App", filePath: "App.vue", line: 10 }],
      }),
    );
    expect(result).toContain("- App (App.vue:10)");
  });

  it("includes component stack entry without filePath", () => {
    const result = buildLogPrompt(makeLog({ componentStack: [{ name: "App" }] }));
    expect(result).toContain("- App\n");
    expect(result).not.toContain("(");
  });

  it("includes component with filePath but no line", () => {
    const result = buildLogPrompt(
      makeLog({ componentStack: [{ name: "App", filePath: "App.vue" }] }),
    );
    expect(result).toContain("- App (App.vue)");
    expect(result).not.toContain("App.vue:");
  });

  it("omits component stack section when empty array", () => {
    const result = buildLogPrompt(makeLog({ componentStack: [] }));
    expect(result).not.toContain("Component stack");
  });

  it("includes source file and line when present", () => {
    const result = buildLogPrompt(makeLog({ sourceFile: "main.ts", sourceLine: 42 }));
    expect(result).toContain("Source: main.ts:42");
  });

  it("includes source file without line", () => {
    const result = buildLogPrompt(makeLog({ sourceFile: "main.ts" }));
    expect(result).toContain("Source: main.ts");
    expect(result).not.toContain("main.ts:");
  });

  it("builds full prompt with all sections", () => {
    const result = buildLogPrompt(
      makeLog({
        level: "error",
        source: "vue",
        message: "Cannot read property",
        stack: "Error: Cannot read property\n  at Comp.vue:5",
        vueInfo: "setup function",
        componentStack: [{ name: "MyComp", filePath: "MyComp.vue", line: 5 }],
        sourceFile: "MyComp.vue",
        sourceLine: 5,
      }),
    );
    expect(result).toContain("[vue/error] Cannot read property");
    expect(result).toContain("```");
    expect(result).toContain("Vue lifecycle: setup function");
    expect(result).toContain("- MyComp (MyComp.vue:5)");
    expect(result).toContain("Source: MyComp.vue:5");
  });
});

describe("buildContextPrompt", () => {
  it("builds a full packet with grab, console, and network sections", () => {
    const result = buildContextPrompt({
      result: makeGrabResult(),
      logs: [makeLog({ message: "submit failed", timestamp: 2 })],
      network: [makeRequest({ url: "https://example.com/api/save", timestamp: 3 })],
    });

    expect(result).toContain("# Vue Grab Context Packet");
    expect(result).toContain("- Selector: `button.save`");
    expect(result).toContain("- Component: SaveButton (src/SaveButton.vue:12)");
    expect(result).toContain("### A11y Attributes");
    expect(result).toContain('- aria-label="Save"');
    expect(result).toContain('```html\n<button aria-label="Save">Save</button>\n```');
    expect(result).toContain("## Console");
    expect(result).toContain("- [error] submit failed");
    expect(result).toContain("## Network");
    expect(result).toContain("[fetch] GET https://example.com/api/save -> 200 42ms");
  });

  it("builds a diagnostics-only packet when no element has been grabbed", () => {
    const result = buildContextPrompt({
      result: null,
      logs: [makeLog({ message: "warn only", level: "warn" })],
      network: [],
    });

    expect(result).toContain("No element has been grabbed yet");
    expect(result).toContain("- [warn] warn only");
    expect(result).toContain("No network activity captured");
  });

  it("truncates long HTML blocks", () => {
    const html = `<div>${"x".repeat(2500)}</div>`;
    const result = buildContextPrompt({
      result: makeGrabResult({ html }),
      logs: [],
      network: [],
    });

    expect(result).toContain("<!-- truncated -->");
    expect(result.length).toBeLessThan(html.length + 900);
  });

  it("formats component stack entries with optional file and line", () => {
    const result = buildContextPrompt({
      result: makeGrabResult({
        componentStack: [{ name: "Child", filePath: "src/Child.vue" }, { name: "Parent" }],
      }),
      logs: [],
      network: [],
    });

    expect(result).toContain("- Child (src/Child.vue)");
    expect(result).toContain("- Parent");
  });

  it("summarizes newest console entries first with counts and source", () => {
    const result = buildContextPrompt({
      result: null,
      logs: [
        makeLog({ message: "old", timestamp: 1 }),
        makeLog({
          message: "new",
          timestamp: 2,
          count: 3,
          componentStack: [{ name: "App", filePath: "src/App.vue", line: 5 }],
        }),
      ],
      network: [],
    });

    const newIndex = result.indexOf("[error] new x3 (src/App.vue:5)");
    const oldIndex = result.indexOf("[error] old");
    expect(newIndex).toBeGreaterThan(-1);
    expect(oldIndex).toBeGreaterThan(newIndex);
  });

  it("summarizes failed network requests with newest entries first", () => {
    const result = buildContextPrompt({
      result: null,
      logs: [],
      network: [
        makeRequest({ url: "/api/old", timestamp: 1 }),
        makeRequest({
          url: "/api/new",
          timestamp: 2,
          status: undefined,
          statusClass: "failed",
          error: "Network down",
          count: 2,
          sourceFile: "src/api.ts",
          sourceLine: 9,
        }),
      ],
    });

    const failedIndex = result.indexOf("[fetch] GET /api/new -> FAILED: Network down 42ms x2");
    const oldIndex = result.indexOf("[fetch] GET /api/old -> 200 42ms");
    expect(failedIndex).toBeGreaterThan(-1);
    expect(result).toContain("(src/api.ts:9)");
    expect(oldIndex).toBeGreaterThan(failedIndex);
  });
});
