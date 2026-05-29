import { describe, expect, it } from "vitest";

import { parseLocationPaths, extractFileLikeTokens } from "./path-grounding.js";

describe("path-grounding", () => {
  it("extracts file paths from text", () => {
    const tokens = extractFileLikeTokens("Modified src/auth/jwt.ts for token handling");
    expect(tokens).toContain("src/auth/jwt.ts");
  });

  it("parses file paths from location strings", () => {
    const paths = parseLocationPaths("src/auth/jwt.ts::verifyToken");
    expect(paths).toContain("src/auth/jwt.ts");
  });
});
