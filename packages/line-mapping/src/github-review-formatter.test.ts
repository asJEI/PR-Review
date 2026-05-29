import { describe, expect, it } from "vitest";

import { formatGitHubReviewComment } from "./github-review-formatter.js";
import { mapSymbolToDiff } from "./symbol-diff-mapper.js";
import { createLineMappingInput } from "./test-fixtures.js";

describe("github-review-formatter", () => {
  it("formats line+side payload for mapped comment", () => {
    const mapping = mapSymbolToDiff(
      createLineMappingInput(),
      "src/auth/jwt.ts",
      "refreshToken",
    );
    const payload = formatGitHubReviewComment(mapping, "Check expiry parsing");

    expect(payload.path).toBe("src/auth/jwt.ts");
    expect(payload.line).toBeDefined();
    expect(payload.side).toBe("RIGHT");
    expect(payload.position).toBeDefined();
  });

  it("formats file-level payload when mapping is inferred-only", () => {
    const payload = formatGitHubReviewComment(null, "Overall auth changes", {
      path: "src/auth/jwt.ts",
    });

    expect(payload.path).toBe("src/auth/jwt.ts");
    expect(payload.body).toContain("[File-level review]");
    expect(payload.line).toBeUndefined();
  });

  it("passes commit_id when provided", () => {
    const mapping = mapSymbolToDiff(
      createLineMappingInput(),
      "src/auth/jwt.ts",
      "verifyToken",
    );
    const payload = formatGitHubReviewComment(mapping, "Verify maxAge", {
      commitId: "abc123",
    });

    expect(payload.commit_id).toBe("abc123");
  });
});
