import { parseUnifiedDiff } from "@pr-review/diff-parser";
import { describe, expect, it } from "vitest";

import { HeuristicSymbolExtractor } from "./heuristic-symbol-extractor.js";

const TS_PATCH = `@@ -1,2 +1,6 @@
+export class UserService {
+  async login() {
+    return true;
+  }
+}
`;

describe("HeuristicSymbolExtractor", () => {
  it("extracts class and method from TypeScript patch", () => {
    const extractor = new HeuristicSymbolExtractor();
    const parsedDiff = parseUnifiedDiff("src/user.ts", TS_PATCH);

    const symbols = extractor.extract({
      filename: "src/user.ts",
      language: "typescript",
      parsedDiff,
      maxSymbols: 20,
    });

    expect(symbols.some((s) => s.name === "UserService" && s.kind === "class")).toBe(
      true,
    );
    expect(symbols.some((s) => s.name === "login")).toBe(true);
  });
});
