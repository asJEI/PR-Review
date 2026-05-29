import { describe, expect, it } from "vitest";

import { isNoisePath, noisePathReason } from "./path-noise-filter.js";

describe("path-noise-filter", () => {
  it("flags vendor, dist, and lock paths", () => {
    expect(isNoisePath("vendor/foo/bar.js")).toBe(true);
    expect(isNoisePath("packages/app/dist/index.js")).toBe(true);
    expect(isNoisePath("package-lock.json")).toBe(true);
    expect(isNoisePath("pnpm-lock.yaml")).toBe(true);
    expect(isNoisePath("src/auth/service.ts")).toBe(false);
  });

  it("returns human-readable drop reasons", () => {
    expect(noisePathReason("package-lock.json")).toBe("lock file");
    expect(noisePathReason("assets/app.min.js")).toBe("generated/minified asset");
  });
});
