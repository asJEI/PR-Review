import { describe, expect, it } from "vitest";

import {
  assertNoDiffMarkers,
  containsDiffMarkers,
  sanitizePromptText,
} from "./prompt-guardrails.js";

describe("prompt-guardrails", () => {
  it("detects diff markers", () => {
    expect(containsDiffMarkers("@@ -1,3 +1,4 @@")).toBe(true);
    expect(containsDiffMarkers("normal engineering context")).toBe(false);
  });

  it("throws when diff markers are present", () => {
    expect(() => assertNoDiffMarkers("+++ b/file.ts", "test")).toThrow(
      /guardrail violated/,
    );
  });

  it("sanitizes diff marker lines", () => {
    const cleaned = sanitizePromptText("keep\n@@ hunk\n+++ file\nalso keep");
    expect(cleaned).not.toContain("@@");
    expect(cleaned).toContain("keep");
  });
});
