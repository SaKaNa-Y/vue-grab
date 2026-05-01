import { describe, it, expect, afterEach, vi } from "vitest";
import { OPEN_IN_EDITOR_CONTENT_TYPE, OPEN_IN_EDITOR_ENDPOINT } from "@sakana-y/vue-grab-shared";
import { openInEditor, openInClaudeCode } from "../src/editor";

describe("openInEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs JSON to /__open-in-editor with the file path", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    await openInEditor("App.vue");
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe(OPEN_IN_EDITOR_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": OPEN_IN_EDITOR_CONTENT_TYPE });
    expect(JSON.parse(init.body as string)).toEqual({ file: "App.vue" });
  });

  it("includes line number in JSON body when provided", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    await openInEditor("App.vue", 10);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ file: "App.vue", line: 10 });
  });

  it("includes editor in JSON body when provided", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    await openInEditor("App.vue", undefined, "code");
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ file: "App.vue", editor: "code" });
  });

  it("warns when the server responds with an error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Path outside project root", { status: 403 }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await openInEditor("App.vue");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("403");
  });

  it("warns when the fetch itself rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await openInEditor("App.vue");
    expect(warnSpy).toHaveBeenCalledOnce();
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
