import { describe, it, expect } from "vitest";
import { getComponentName } from "../../src/utils/component";

describe("getComponentName", () => {
  it("returns type.name when present", () => {
    expect(getComponentName({ type: { name: "MyComp" } })).toBe("MyComp");
  });

  it("returns type.__name when name is absent", () => {
    expect(getComponentName({ type: { __name: "SFC" } })).toBe("SFC");
  });

  it("prefers type.name over type.__name", () => {
    expect(getComponentName({ type: { name: "A", __name: "B" } })).toBe("A");
  });

  it("returns fallback when instance is null", () => {
    expect(getComponentName(null, "fallback")).toBe("fallback");
  });

  it("returns fallback when instance has no type", () => {
    expect(getComponentName({}, "fb")).toBe("fb");
  });

  it("returns empty string when no name and no fallback", () => {
    expect(getComponentName({})).toBe("");
  });
});
