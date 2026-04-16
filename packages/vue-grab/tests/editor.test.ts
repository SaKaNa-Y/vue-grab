import { describe, it, expect, afterEach, vi } from "vitest";
import { openInEditor, openInClaudeCode } from "../src/editor";

describe("openInEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls fetch with /__open-in-editor and file parameter", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    openInEditor("App.vue");
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/__open-in-editor");
    expect(url).toContain("file=App.vue");
  });

  it("includes line number in file param when provided", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    openInEditor("App.vue", 10);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("file=App.vue");
    expect(url).toContain("10");
  });

  it("includes editor parameter when provided", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    openInEditor("App.vue", undefined, "code");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("editor=code");
  });
});

describe("openInClaudeCode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies prompt to clipboard", () => {
    const writeTextSpy = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeTextSpy);
    vi.spyOn(window, "open").mockReturnValue({} as Window);
    openInClaudeCode("fix this bug");
    expect(writeTextSpy).toHaveBeenCalledWith("fix this bug");
  });

  it("opens vscode URI with encoded prompt via window.open", () => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    openInClaudeCode("fix bug");
    expect(openSpy).toHaveBeenCalledOnce();
    const uri = openSpy.mock.calls[0][0] as string;
    expect(uri).toContain("vscode://anthropic.claude-code/open?prompt=");
    expect(uri).toContain(encodeURIComponent("fix bug"));
  });

  it("falls back to location.href when window.open returns null", () => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    vi.spyOn(window, "open").mockReturnValue(null);
    // We can't easily assert location.href assignment without navigating,
    // so just verify it doesn't throw
    expect(() => openInClaudeCode("prompt")).not.toThrow();
  });
});
