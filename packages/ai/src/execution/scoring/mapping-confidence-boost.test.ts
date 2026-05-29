import { describe, expect, it } from "vitest";

import {
  mappingConfidenceBoost,
  mappingConfidencePenalty,
} from "./mapping-confidence-boost.js";

describe("mapping-confidence-boost", () => {
  it("applies exact, approximate, and inferred weights", () => {
    expect(mappingConfidenceBoost("exact")).toBe(0.12);
    expect(mappingConfidenceBoost("approximate")).toBe(0.05);
    expect(mappingConfidenceBoost("inferred")).toBe(0);

    expect(mappingConfidencePenalty("inferred", true)).toBe(0.25);
    expect(mappingConfidencePenalty("exact", true, true)).toBe(0.08);
  });
});
