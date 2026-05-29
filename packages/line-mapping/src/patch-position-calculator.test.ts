import { describe, expect, it } from "vitest";

import { calculatePatchPosition, walkPatchPositions } from "./patch-position-calculator.js";
import { JWT_PATCH } from "./test-fixtures.js";

describe("patch-position-calculator", () => {
  it("returns patch-relative position for a changed line", () => {
    const position = calculatePatchPosition(JWT_PATCH, { side: "RIGHT", line: 39 });
    expect(position).toBeGreaterThan(0);
  });

  it("walks multi-hunk patches including both hunks", () => {
    const entries = walkPatchPositions(JWT_PATCH);
    expect(entries.some((entry) => entry.line === 85)).toBe(true);
    expect(entries.some((entry) => entry.line === 39)).toBe(true);
  });

  it("maps refreshToken additions to positions", () => {
    const position = calculatePatchPosition(JWT_PATCH, { side: "RIGHT", line: 87 });
    expect(position).not.toBeNull();
  });
});
