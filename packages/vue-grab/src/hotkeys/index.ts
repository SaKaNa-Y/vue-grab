interface ParsedCombo {
  key: string;
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.split("+").map((p) => p.trim().toLowerCase());
  return {
    key: parts[parts.length - 1],
    alt: parts.includes("alt"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
  };
}

export class HotkeyManager {
  private cleanups: (() => void)[] = [];

  register(combo: string, callback: () => void): void {
    const parsed = parseCombo(combo);

    const handler = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === parsed.key &&
        e.altKey === parsed.alt &&
        e.ctrlKey === parsed.ctrl &&
        e.shiftKey === parsed.shift &&
        e.metaKey === parsed.meta
      ) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handler, { capture: true });
    this.cleanups.push(() => document.removeEventListener("keydown", handler, { capture: true }));
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}
