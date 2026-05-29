import { describe, expect, it } from "vitest";

import {
  buildReviewContextFromParsedDiffs,
  toPullRequestData,
} from "./parsed-diff-input.js";

describe("parsed-diff-input adapter", () => {
  it("builds review context without GitHub metadata", () => {
    const pr = toPullRequestData([
      {
        filename: "src/main.ts",
        patch: `@@ -0,0 +1,2 @@
+export function main() {}
`,
        status: "added",
        additions: 2,
      },
    ]);

    expect(pr.metadata.title).toBe("Parsed diff input");
    expect(pr.changedFiles).toHaveLength(1);

    const context = buildReviewContextFromParsedDiffs([
      {
        filename: "src/main.ts",
        patch: `@@ -0,0 +1,2 @@
+export function main() {}
`,
      },
    ]);

    expect(context.files).toHaveLength(1);
    expect(context.modules.length).toBeGreaterThan(0);
  });
});
