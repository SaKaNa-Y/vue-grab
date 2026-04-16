import { describe, it, expect, afterEach } from "vitest";
import { hasA11yAttributes, extractA11yInfo, scanPageA11y } from "../../src/utils/a11y";

function el(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const e = document.createElement(tag);
  e.setAttribute("data-a11y-test", "");
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  document.body.appendChild(e);
  return e;
}

afterEach(() => {
  document.querySelectorAll("[data-a11y-test]").forEach((e) => e.remove());
  // Clean up elements created by scanPageA11y tests (via __vueParentComponent)
  document.querySelectorAll("body > div:not(#vitest-browser)").forEach((e) => {
    if (!(e as any).__vueParentComponent && !e.id) e.remove();
  });
});

describe("hasA11yAttributes", () => {
  it("returns true when element has role attribute", () => {
    expect(hasA11yAttributes(el("div", { role: "button" }))).toBe(true);
  });

  it("returns true when element has aria-label", () => {
    expect(hasA11yAttributes(el("div", { "aria-label": "test" }))).toBe(true);
  });

  it("returns true when element has tabindex", () => {
    expect(hasA11yAttributes(el("div", { tabindex: "0" }))).toBe(true);
  });

  it("returns true for img with alt attribute", () => {
    expect(hasA11yAttributes(el("img", { alt: "photo" }))).toBe(true);
  });

  it("returns false for plain div with no a11y attrs", () => {
    expect(hasA11yAttributes(el("div"))).toBe(false);
  });

  it("returns false for img without alt", () => {
    expect(hasA11yAttributes(el("img", { src: "x.png" }))).toBe(false);
  });
});

describe("extractA11yInfo", () => {
  it("extracts role and aria-label attributes", () => {
    const info = extractA11yInfo(el("div", { role: "button", "aria-label": "click" }));
    expect(info.attributes).toEqual(
      expect.arrayContaining([
        { name: "role", value: "button" },
        { name: "aria-label", value: "click" },
      ]),
    );
  });

  it("extracts alt attribute for img elements", () => {
    const info = extractA11yInfo(el("img", { alt: "photo" }));
    expect(info.attributes).toEqual(expect.arrayContaining([{ name: "alt", value: "photo" }]));
  });

  it("sets hasA11y to true when attributes are found", () => {
    const info = extractA11yInfo(el("div", { role: "alert" }));
    expect(info.hasA11y).toBe(true);
  });

  it("sets hasA11y to false when no attributes found", () => {
    const info = extractA11yInfo(el("div"));
    expect(info.hasA11y).toBe(false);
  });

  describe("audit rules", () => {
    it("reports warning for img without alt", () => {
      const info = extractA11yInfo(el("img", { src: "x.png" }));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ severity: "warning", message: expect.stringContaining("alt") }),
        ]),
      );
    });

    it("no warning for img with alt", () => {
      const info = extractA11yInfo(el("img", { alt: "description" }));
      const imgWarnings = info.audit.filter((a) => a.message.includes("alt"));
      expect(imgWarnings).toHaveLength(0);
    });

    it("reports warning for button with no text and no aria-label", () => {
      const info = extractA11yInfo(el("button"));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            message: expect.stringContaining("accessible name"),
          }),
        ]),
      );
    });

    it("no warning for button with text content", () => {
      const btn = el("button");
      btn.textContent = "Click me";
      const info = extractA11yInfo(btn);
      const nameWarnings = info.audit.filter((a) => a.message.includes("accessible name"));
      expect(nameWarnings).toHaveLength(0);
    });

    it("no warning for button with aria-label", () => {
      const info = extractA11yInfo(el("button", { "aria-label": "Close" }));
      const nameWarnings = info.audit.filter((a) => a.message.includes("accessible name"));
      expect(nameWarnings).toHaveLength(0);
    });

    it("reports warning for anchor with no text and no aria-label", () => {
      const info = extractA11yInfo(el("a", { href: "#" }));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            message: expect.stringContaining("<a>"),
          }),
        ]),
      );
    });

    it("reports warning for input without label or aria-label", () => {
      const info = extractA11yInfo(el("input", { type: "text" }));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            message: expect.stringContaining("label"),
          }),
        ]),
      );
    });

    it("no warning for input with associated label[for]", () => {
      const input = el("input", { id: "my-input", type: "text" });
      const label = document.createElement("label");
      label.setAttribute("for", "my-input");
      document.body.appendChild(label);
      const info = extractA11yInfo(input);
      const labelWarnings = info.audit.filter((a) => a.message.includes("label"));
      expect(labelWarnings).toHaveLength(0);
    });

    it("no warning for input with aria-label", () => {
      const info = extractA11yInfo(el("input", { "aria-label": "Search", type: "text" }));
      const labelWarnings = info.audit.filter((a) => a.message.includes("label"));
      expect(labelWarnings).toHaveLength(0);
    });

    it("reports info for div[role=button] without tabindex", () => {
      const info = extractA11yInfo(el("div", { role: "button" }));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "info",
            message: expect.stringContaining("tabindex"),
          }),
        ]),
      );
    });

    it("no info for native button with role=button", () => {
      const btn = el("button", { role: "button" });
      btn.textContent = "Click";
      const info = extractA11yInfo(btn);
      const tabWarnings = info.audit.filter((a) => a.message.includes("tabindex"));
      expect(tabWarnings).toHaveLength(0);
    });

    it("reports warning for aria-hidden=true on focusable button", () => {
      const btn = el("button", { "aria-hidden": "true" });
      btn.textContent = "Hidden";
      const info = extractA11yInfo(btn);
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            message: expect.stringContaining("aria-hidden"),
          }),
        ]),
      );
    });

    it("reports warning for aria-hidden=true on element with tabindex", () => {
      const info = extractA11yInfo(el("div", { "aria-hidden": "true", tabindex: "0" }));
      expect(info.audit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            message: expect.stringContaining("aria-hidden"),
          }),
        ]),
      );
    });

    it("no warning for aria-hidden=true on non-focusable div", () => {
      const info = extractA11yInfo(el("div", { "aria-hidden": "true" }));
      const hiddenWarnings = info.audit.filter((a) => a.message.includes("aria-hidden"));
      expect(hiddenWarnings).toHaveLength(0);
    });
  });
});

describe("scanPageA11y", () => {
  it("returns empty array when no Vue components found", () => {
    expect(scanPageA11y()).toEqual([]);
  });

  it("collects components with __vueParentComponent", () => {
    const root = el("div");
    const child = document.createElement("button");
    child.textContent = "Click";
    root.appendChild(child);

    const instance = {
      type: { name: "TestComp" },
      subTree: { el: root },
    };
    (root as any).__vueParentComponent = instance;

    const results = scanPageA11y();
    const comp = results.find((r) => r.componentName === "TestComp");
    expect(comp).toBeDefined();
    expect(comp!.element).toBe(root);
  });

  it("aggregates child element audit results", () => {
    const root = el("div");
    const img = document.createElement("img");
    img.setAttribute("src", "x.png");
    root.appendChild(img);

    const instance = {
      type: { name: "ImgComp" },
      subTree: { el: root },
    };
    (root as any).__vueParentComponent = instance;

    const results = scanPageA11y();
    const comp = results.find((r) => r.componentName === "ImgComp");
    expect(comp).toBeDefined();
    // img without alt should produce a warning aggregated into the component
    expect(comp!.a11y.audit.length).toBeGreaterThan(0);
    expect(comp!.a11y.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("alt") }),
      ]),
    );
  });
});
