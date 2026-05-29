import { describe, expect, it } from "vitest";

import { mapCommentToLocation } from "./comment-mapper.js";
import { createLineMappingInput } from "./test-fixtures.js";

describe("comment-mapper", () => {
  it("maps numeric lineHint to exact location", () => {
    const mapping = mapCommentToLocation(createLineMappingInput(), {
      file: "src/auth/jwt.ts",
      line: null,
      symbol: null,
      lineHint: "86",
    });

    expect(mapping?.startLine).toBe(86);
    expect(mapping?.confidence).toBe("exact");
  });

  it("falls back to symbol mapping", () => {
    const mapping = mapCommentToLocation(createLineMappingInput(), {
      file: "src/auth/jwt.ts",
      line: null,
      symbol: "refreshToken",
      lineHint: null,
    });

    expect(mapping?.symbol).toBe("refreshToken");
    expect(mapping?.hunkIndex).toBe(1);
  });

  it("resolves renamed file paths via aliases", () => {
    const mapping = mapCommentToLocation(createLineMappingInput(), {
      file: "src/auth/old-jwt.ts",
      line: null,
      symbol: "refreshToken",
      lineHint: null,
    });

    expect(mapping?.file).toBe("src/auth/jwt.ts");
  });
});
