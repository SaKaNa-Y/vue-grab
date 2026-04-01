import { describe, it, expect, afterEach, vi } from "vitest";
import { init } from "../src/init";
import { OVERLAY_HOST_ID } from "../src/overlay";
import { cleanupDOM, createTargetElement, fireClickAtCenter } from "./helpers/setup";

describe("init", () => {
  let instance: ReturnType<typeof init>;

  afterEach(() => {
    instance?.destroy();
    cleanupDOM();
  });

  it("returns activate, deactivate, onGrab, and destroy functions", () => {
    instance = init();
    expect(typeof instance.activate).toBe("function");
    expect(typeof instance.deactivate).toBe("function");
    expect(typeof instance.onGrab).toBe("function");
    expect(typeof instance.destroy).toBe("function");
  });

  it("activate sets cursor to crosshair", () => {
    instance = init();
    instance.activate();
    expect(document.body.style.cursor).toBe("crosshair");
  });

  it("deactivate restores cursor", () => {
    instance = init();
    instance.activate();
    instance.deactivate();
    expect(document.body.style.cursor).not.toBe("crosshair");
  });

  it("onGrab receives GrabResult on click", () => {
    instance = init();
    const cb = vi.fn();
    instance.onGrab(cb);
    instance.activate();

    const target = createTargetElement("div", { id: "init-target" });
    fireClickAtCenter(target);

    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0][0].selector).toBe("#init-target");
  });

  it("destroy cleans up overlay and listeners", () => {
    instance = init();
    instance.activate();
    expect(document.getElementById(OVERLAY_HOST_ID)).not.toBeNull();

    instance.destroy();
    expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
  });

  it("accepts custom config options", () => {
    instance = init({ highlightColor: "#00ff00" });
    instance.activate();

    const host = document.getElementById(OVERLAY_HOST_ID)!;
    expect(host.style.getPropertyValue("--grab-color")).toBe("#00ff00");
  });
});
