import { describe, expect, it } from "vitest";

import { buildCloneTransform } from "../src/magnifier/clone";
import { buildCompactTag } from "../src/magnifier/html-label";

describe("magnifier helpers", () => {
  it("builds compact element labels with id, class, and text", () => {
    const el = document.createElement("button");
    el.id = "save";
    el.className = "btn primary";
    el.textContent = "Save changes";

    expect(buildCompactTag(el, 200)).toBe(
      '<button id="save" class="btn primary">Save changes</button>',
    );
  });

  it("truncates compact labels to the configured maximum length", () => {
    const el = document.createElement("div");
    el.textContent = "This text is longer than the label budget";

    expect(buildCompactTag(el, 12)).toBe("<div>This te...");
  });

  it("builds clone transform from viewport and scroll coordinates", () => {
    expect(buildCloneTransform(10, 20, 5, 6, 100, 2)).toBe("translate(20px, -2px) scale(2)");
  });
});
