import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_CONFIG } from "@sakana-y/vue-grab-shared";
import { createGrabSession } from "../src/session";
import { OVERLAY_HOST_ID } from "../src/overlay";
import { FAB_HOST_ID } from "../src/floating-button";
import { MAGNIFIER_HOST_ID } from "../src/magnifier";
import { MEASURER_HOST_ID } from "../src/measurer";
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

  it("registered shortcuts open floating bar panels", () => {
    session = createGrabSession({
      ...DEFAULT_CONFIG,
      floatingButton: {
        ...DEFAULT_CONFIG.floatingButton,
        enabled: true,
        shortcuts: {
          settings: ["Ctrl+Shift+S"],
          logs: ["Ctrl+Shift+L"],
          network: ["Ctrl+Shift+N"],
          accessibility: ["Ctrl+Shift+A"],
        },
      },
    });
    const shadow = document.getElementById(FAB_HOST_ID)!.shadowRoot!;

    fireKey("s", { ctrlKey: true, shiftKey: true });
    expect(shadow.querySelector('[data-tab-content="dock"]')).not.toBeNull();

    fireKey("l", { ctrlKey: true, shiftKey: true });
    expect(shadow.querySelector(".logs-panel")).not.toBeNull();

    fireKey("n", { ctrlKey: true, shiftKey: true });
    expect(shadow.querySelector(".network-panel")).not.toBeNull();

    fireKey("a", { ctrlKey: true, shiftKey: true });
    expect(shadow.querySelector(".a11y-panel")).not.toBeNull();
  });

  it("registered shortcuts toggle magnifier, measurer, and grab", () => {
    session = createGrabSession({
      ...DEFAULT_CONFIG,
      floatingButton: {
        ...DEFAULT_CONFIG.floatingButton,
        enabled: true,
        shortcuts: {
          grab: ["Ctrl+Shift+G"],
          magnifier: ["Ctrl+Shift+I"],
          measurer: ["Ctrl+Shift+M"],
        },
      },
    });

    fireKey("i", { ctrlKey: true, shiftKey: true });
    expect(
      document
        .getElementById(MAGNIFIER_HOST_ID)!
        .shadowRoot!.querySelector(".magnifier-container")!
        .classList.contains("active"),
    ).toBe(true);

    fireKey("i", { ctrlKey: true, shiftKey: true });
    fireKey("m", { ctrlKey: true, shiftKey: true });
    expect(
      document
        .getElementById(MEASURER_HOST_ID)!
        .shadowRoot!.querySelector(".measurer-container")!
        .classList.contains("active"),
    ).toBe(true);

    fireKey("m", { ctrlKey: true, shiftKey: true });
    fireKey("g", { ctrlKey: true, shiftKey: true });
    expect(session.engine.isActive).toBe(true);
  });

  it("re-registers shortcuts after settings changes", () => {
    session = createGrabSession({
      ...DEFAULT_CONFIG,
      floatingButton: {
        ...DEFAULT_CONFIG.floatingButton,
        enabled: true,
        shortcuts: {
          logs: ["Ctrl+Shift+L"],
        },
      },
    });
    const shadow = document.getElementById(FAB_HOST_ID)!.shadowRoot!;
    shadow.querySelector<HTMLElement>(".gear-btn")!.click();
    Array.from(shadow.querySelectorAll<HTMLElement>(".tab-btn"))
      .find((btn) => btn.textContent === "Shortcuts")!
      .click();
    shadow.querySelector<HTMLElement>('[data-shortcut-record="network"]')!.click();
    fireKey("n", { ctrlKey: true, shiftKey: true });

    fireKey("n", { ctrlKey: true, shiftKey: true });
    expect(shadow.querySelector(".network-panel")).not.toBeNull();
  });
});
