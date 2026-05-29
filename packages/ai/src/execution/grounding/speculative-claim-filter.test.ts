import { describe, expect, it } from "vitest";

import { isSpeculativeClaim, shouldDropSpeculativeComment } from "./speculative-claim-filter.js";

describe("speculative-claim-filter", () => {
  it("detects speculative language", () => {
    expect(isSpeculativeClaim("This might be a bug")).toBe(true);
    expect(isSpeculativeClaim("verifyToken needs tests")).toBe(false);
  });

  it("keeps speculative claims when anchored to file or symbol", () => {
    expect(
      shouldDropSpeculativeComment(
        "verifyToken might be wrong in src/auth/jwt.ts",
        "src/auth/jwt.ts",
        "verifyToken",
      ),
    ).toBe(false);
  });
});
