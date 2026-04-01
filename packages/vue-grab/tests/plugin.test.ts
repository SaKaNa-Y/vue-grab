import { describe, it, expect } from "vitest";
import { createVueGrab } from "../src";

describe("createVueGrab", () => {
  it("should create a Vue plugin", () => {
    const plugin = createVueGrab();
    expect(plugin).toHaveProperty("install");
    expect(typeof plugin.install).toBe("function");
  });
});
