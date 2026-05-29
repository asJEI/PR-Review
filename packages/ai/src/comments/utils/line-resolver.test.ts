import { describe, expect, it } from "vitest";

import { resolveCommentLine } from "./line-resolver.js";
import { createReviewCommentFixture } from "../../test-fixtures.js";

describe("line-resolver", () => {
  it("returns line when lineHint falls within hunk range", () => {
    const { reviewContext } = createReviewCommentFixture();
    const line = resolveCommentLine("src/auth/jwt.ts", "42", "verifyToken", reviewContext);
    expect(line).toBe(42);
  });

  it("returns null for lineHint outside hunk range", () => {
    const { reviewContext } = createReviewCommentFixture();
    const line = resolveCommentLine("src/auth/jwt.ts", "999", null, reviewContext);
    expect(line).toBeNull();
  });
});
