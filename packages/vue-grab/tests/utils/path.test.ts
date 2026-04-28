import { describe, it, expect, afterEach } from "vitest";
import { toRelativePath, normalizeRoot } from "../../src/utils/path";

type GlobalWithRoot = { __VUE_GRAB_ROOT__?: string };

function setRoot(value: string | undefined): void {
  const g = globalThis as GlobalWithRoot;
  if (value === undefined) delete g.__VUE_GRAB_ROOT__;
  else g.__VUE_GRAB_ROOT__ = value;
}

describe("normalizeRoot", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizeRoot("F:\\toy_cc\\vue-grab")).toBe("F:/toy_cc/vue-grab");
  });

  it("strips trailing slash", () => {
    expect(normalizeRoot("/home/user/app/")).toBe("/home/user/app");
  });
});

describe("toRelativePath", () => {
  afterEach(() => setRoot(undefined));

  it("returns absolute path unchanged when root is not injected", () => {
    setRoot(undefined);
    expect(toRelativePath("F:/toy_cc/vue-grab/playground/src/App.vue")).toBe(
      "F:/toy_cc/vue-grab/playground/src/App.vue",
    );
  });

  it("strips matching root prefix", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath("F:/toy_cc/vue-grab/playground/src/App.vue")).toBe("src/App.vue");
  });

  it("is case-insensitive on Windows drive letters", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath("f:/toy_cc/vue-grab/playground/src/App.vue")).toBe("src/App.vue");
  });

  it("is case-sensitive for POSIX roots", () => {
    setRoot("/home/User/app");
    expect(toRelativePath("/home/user/app/src/App.vue")).toBe("/home/user/app/src/App.vue");
  });

  it("normalizes backslashes in the input", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath("F:\\toy_cc\\vue-grab\\playground\\src\\App.vue")).toBe("src/App.vue");
  });

  it("returns path unchanged when it does not start with root", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath("F:/other/repo/src/App.vue")).toBe("F:/other/repo/src/App.vue");
  });

  it("tolerates a trailing slash on the injected root", () => {
    setRoot("F:/toy_cc/vue-grab/playground/");
    expect(toRelativePath("F:/toy_cc/vue-grab/playground/src/App.vue")).toBe("src/App.vue");
  });

  it("returns empty string when path equals root", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath("F:/toy_cc/vue-grab/playground")).toBe("");
  });

  it("returns empty string for undefined input", () => {
    setRoot("F:/toy_cc/vue-grab/playground");
    expect(toRelativePath(undefined)).toBe("");
  });
});
