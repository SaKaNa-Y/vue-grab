import { describe, it, expect, afterEach, vi } from "vitest";
import { HotkeyManager } from "../src/hotkeys";

describe("HotkeyManager", () => {
  let manager: HotkeyManager;

  afterEach(() => {
    manager?.destroy();
  });

  describe("register", () => {
    it("fires callback on exact combo match (Alt+Shift+G)", () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Alt+Shift+G", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "g",
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );

      expect(cb).toHaveBeenCalledOnce();
    });

    it("does not fire on partial modifier match", () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Alt+Shift+G", cb);

      // Only Alt, missing Shift
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "g",
          altKey: true,
          shiftKey: false,
          bubbles: true,
        }),
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it("does not fire on wrong key", () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Alt+Shift+G", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "h",
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it("handles Ctrl+K combo", () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Ctrl+K", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        }),
      );

      expect(cb).toHaveBeenCalledOnce();
    });

    it('treats "control" as alias for "ctrl"', () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Control+K", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        }),
      );

      expect(cb).toHaveBeenCalledOnce();
    });

    it('treats "cmd" as alias for "meta"', () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Cmd+S", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          metaKey: true,
          bubbles: true,
        }),
      );

      expect(cb).toHaveBeenCalledOnce();
    });

    it('treats "command" as alias for "meta"', () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Command+S", cb);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          metaKey: true,
          bubbles: true,
        }),
      );

      expect(cb).toHaveBeenCalledOnce();
    });

    it("calls preventDefault on matching keydown", () => {
      manager = new HotkeyManager();
      manager.register("Alt+Shift+G", () => {});

      const event = new KeyboardEvent("keydown", {
        key: "g",
        altKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const spy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it("supports registering multiple combos independently", () => {
      manager = new HotkeyManager();
      const cb1 = vi.fn<() => void>();
      const cb2 = vi.fn<() => void>();
      manager.register("Ctrl+A", cb1);
      manager.register("Ctrl+B", cb2);

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "a",
          ctrlKey: true,
          bubbles: true,
        }),
      );

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).not.toHaveBeenCalled();

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "b",
          ctrlKey: true,
          bubbles: true,
        }),
      );

      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  describe("destroy", () => {
    it("stops callbacks from firing after destroy", () => {
      manager = new HotkeyManager();
      const cb = vi.fn<() => void>();
      manager.register("Alt+Shift+G", cb);
      manager.destroy();

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "g",
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it("is safe when no handlers are registered", () => {
      manager = new HotkeyManager();
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});
