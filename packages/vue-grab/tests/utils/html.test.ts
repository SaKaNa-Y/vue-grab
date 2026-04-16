import { describe, it, expect } from "vitest";
import { esc } from "../../src/utils/html";

describe("esc", () => {
  it("escapes ampersand", () => {
    expect(esc("a&b")).toBe("a&amp;b");
  });

  it("escapes less-than", () => {
    expect(esc("a<b")).toBe("a&lt;b");
  });

  it("escapes greater-than", () => {
    expect(esc("a>b")).toBe("a&gt;b");
  });

  it("escapes double quotes", () => {
    expect(esc('a"b')).toBe("a&quot;b");
  });

  it("escapes all special chars in one string", () => {
    expect(esc('<div class="a">&</div>')).toBe("&lt;div class=&quot;a&quot;&gt;&amp;&lt;/div&gt;");
  });

  it("returns empty string unchanged", () => {
    expect(esc("")).toBe("");
  });

  it("returns string with no special chars unchanged", () => {
    expect(esc("hello world")).toBe("hello world");
  });
});
