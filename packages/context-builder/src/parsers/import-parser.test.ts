import { parseUnifiedDiff } from "@pr-review/diff-parser";
import { describe, expect, it } from "vitest";

import { extractImportsFromDiff } from "./import-parser.js";

describe("extractImportsFromDiff", () => {
  it("resolves internal relative imports", () => {
    const patch = `@@ -1,2 +1,3 @@
+import { foo } from './utils';
 context
`;
    const parsed = parseUnifiedDiff("src/index.ts", patch);

    const edges = extractImportsFromDiff("src/index.ts", parsed, [
      "src/index.ts",
      "src/utils.ts",
    ]);

    expect(edges.some((e) => e.edgeType === "internal" && e.to.includes("utils"))).toBe(
      true,
    );
  });
});
