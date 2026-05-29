import { describe, expect, it } from "vitest";

import { parseUnifiedDiff } from "./parse-unified-diff.js";

const SAMPLE_PATCH = `@@ -1,3 +1,4 @@
 line1
-old
+new
 context
@@ -10,2 +11,3 @@
 more
`;

describe("parseUnifiedDiff", () => {
  it("parses hunks and line types", () => {
    const result = parseUnifiedDiff("src/a.ts", SAMPLE_PATCH);

    expect(result.isEmpty).toBe(false);
    expect(result.hunks).toHaveLength(2);
    expect(result.hunks[0]?.lines.some((l) => l.type === "delete")).toBe(true);
    expect(result.hunks[0]?.lines.some((l) => l.type === "add")).toBe(true);
    expect(result.hunks[0]?.lines.some((l) => l.type === "context")).toBe(true);
  });

  it("handles null patch", () => {
    const result = parseUnifiedDiff("binary.png", null);

    expect(result.isEmpty).toBe(true);
    expect(result.hunks).toHaveLength(0);
  });
});
