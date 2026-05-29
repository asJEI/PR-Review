import { describe, expect, it } from "vitest";

import { estimateTokens, trimContextLinesByProximity } from "./token-estimate.js";

describe("token-estimate", () => {
  it("estimates tokens from character length", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(40))).toBe(10);
  });

  it("trims context lines by proximity to changes", () => {
    const trimmed = trimContextLinesByProximity(
      [
        { type: "context", content: " far", oldLineNumber: 1, newLineNumber: 1 },
        { type: "context", content: " near", oldLineNumber: 41, newLineNumber: 41 },
      ],
      [42],
      1,
    );

    expect(trimmed).toHaveLength(1);
    expect(trimmed[0]!.content).toContain("near");
  });
});
