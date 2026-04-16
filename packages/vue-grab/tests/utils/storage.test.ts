import { describe, it, expect, afterEach, vi } from "vitest";
import { tryReadStorage, trySaveStorage } from "../../src/utils/storage";

describe("tryReadStorage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns parsed value when key exists", () => {
    localStorage.setItem("k", "42");
    expect(tryReadStorage("k", Number)).toBe(42);
  });

  it("returns null when key does not exist", () => {
    expect(tryReadStorage("missing", Number)).toBeNull();
  });

  it("returns null when raw value is empty string", () => {
    localStorage.setItem("k", "");
    expect(tryReadStorage("k", Number)).toBeNull();
  });

  it("returns null when parse returns null", () => {
    localStorage.setItem("k", "data");
    expect(tryReadStorage("k", () => null)).toBeNull();
  });

  it("returns null when key is empty string", () => {
    expect(tryReadStorage("", Number)).toBeNull();
  });

  it("returns null when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(tryReadStorage("k", Number)).toBeNull();
  });
});

describe("trySaveStorage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves value to localStorage", () => {
    trySaveStorage("k", "v");
    expect(localStorage.getItem("k")).toBe("v");
  });

  it("does nothing when key is empty string", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");
    trySaveStorage("", "v");
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not throw when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => trySaveStorage("k", "v")).not.toThrow();
  });
});
