import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_CONFIG } from "@sakana-y/vue-grab-shared";
import { createGrabSession } from "../src/session";
import { OVERLAY_HOST_ID } from "../src/overlay";
import { cleanupDOM, fireKey } from "./helpers/setup";

describe("createGrabSession", () => {
  let session: ReturnType<typeof createGrabSession>;

  afterEach(() => {
    session?.destroy();
    cleanupDOM();
  });

  it("returns engine, hotkeys, and destroy", () => {
    session = createGrabSession({ ...DEFAULT_CONFIG });
    expect(session.engine).toBeDefined();
    expect(session.hotkeys).toBeDefined();
    expect(typeof session.destroy).toBe("function");
  });

  it("Alt+Shift+G toggles engine on", () => {
    session = createGrabSession({ ...DEFAULT_CONFIG });
    expect(session.engine.isActive).toBe(false);

    fireKey("g", { altKey: true, shiftKey: true });
    expect(session.engine.isActive).toBe(true);
  });

  it("Alt+Shift+G toggles engine off", () => {
    session = createGrabSession({ ...DEFAULT_CONFIG });
    fireKey("g", { altKey: true, shiftKey: true });
    expect(session.engine.isActive).toBe(true);

    fireKey("g", { altKey: true, shiftKey: true });
    expect(session.engine.isActive).toBe(false);
  });

  it("destroy cleans up engine and hotkeys", () => {
    session = createGrabSession({ ...DEFAULT_CONFIG });
    session.engine.activate();
    expect(document.getElementById(OVERLAY_HOST_ID)).not.toBeNull();

    session.destroy();
    expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
    expect(session.engine.isActive).toBe(false);

    // Hotkey should no longer toggle
    fireKey("g", { altKey: true, shiftKey: true });
    expect(session.engine.isActive).toBe(false);
  });
});
