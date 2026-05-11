import { describe, expect, it } from "vitest";
import { DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER } from "@sakana-y/vue-grab-shared";
import {
  normalizeDockEntries,
  normalizeShortcutCombo,
  normalizeShortcuts,
  tryReadEditor,
  tryReadHotkey,
  tryReadString,
} from "../src/floating-button/storage";
import { cloneShortcuts, normalizeShortcutsWithLegacy } from "../src/floating-button/shortcuts";
import { visibleDockEntryIds } from "../src/floating-button/toolbar";

describe("floating button normalization", () => {
  it("normalizes dock entry order and appends missing defaults", () => {
    expect(
      normalizeDockEntries({
        order: ["network", "grab", "network", "unknown" as any],
        hidden: ["settings", "logs", "logs", "unknown" as any],
      }),
    ).toEqual({
      order: [
        "network",
        "grab",
        ...DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER.filter(
          (id) => id !== "network" && id !== "grab",
        ),
      ],
      hidden: ["logs"],
    });
  });

  it("normalizes shortcut combos and drops duplicate bindings globally", () => {
    expect(
      normalizeShortcuts({
        grab: [" Ctrl+G ", "", "Alt+G"],
        logs: ["ctrl+g", "Ctrl+L"],
        network: ["Ctrl+L", "Ctrl+N"],
      }),
    ).toEqual({
      grab: ["Ctrl+G", "Alt+G"],
      logs: ["Ctrl+L"],
      network: ["Ctrl+N"],
    });
  });

  it("returns null for empty shortcut combos", () => {
    expect(normalizeShortcutCombo("  ")).toBeNull();
    expect(normalizeShortcutCombo(null)).toBeNull();
  });

  it("keeps hotkey and editor storage readers compatible with string reads", () => {
    localStorage.setItem("string-key", "cursor");

    expect(tryReadString("string-key")).toBe("cursor");
    expect(tryReadHotkey("string-key")).toBe("cursor");
    expect(tryReadEditor("string-key")).toBe("cursor");
  });

  it("keeps settings visible while filtering hidden dock entries", () => {
    expect(
      visibleDockEntryIds({
        order: ["grab", "logs", "settings", "network", "measurer", "accessibility", "magnifier"],
        hidden: ["logs", "settings", "network"],
      }),
    ).toEqual(["grab", "settings", "measurer", "accessibility", "magnifier"]);
  });

  it("clones shortcut arrays without sharing mutable references", () => {
    const source = { grab: ["Ctrl+G"], logs: ["Ctrl+L"] };
    const cloned = cloneShortcuts(source);

    cloned.grab!.push("Alt+G");

    expect(source.grab).toEqual(["Ctrl+G"]);
    expect(cloned.grab).toEqual(["Ctrl+G", "Alt+G"]);
  });

  it("uses legacy single-hotkey storage as a compatibility override", () => {
    localStorage.setItem("legacy-grab", "Alt+G");
    localStorage.setItem("legacy-measurer", "Alt+M");

    expect(
      normalizeShortcutsWithLegacy(
        { grab: ["Ctrl+G"], measurer: ["Ctrl+M"], logs: ["Ctrl+L"] },
        "legacy-grab",
        "legacy-measurer",
      ),
    ).toEqual({
      grab: ["Alt+G"],
      measurer: ["Alt+M"],
      logs: ["Ctrl+L"],
    });
  });
});
