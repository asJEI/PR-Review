import { analyzeSemantics, parseUnifiedDiff } from "@pr-review/diff-parser";
import { describe, expect, it } from "vitest";

import {
  mapSemanticToImportEdges,
  mapSemanticToSymbolChanges,
} from "./semantic-adapters.js";

const TS_PATCH = `@@ -0,0 +1,5 @@
+import { hash } from './hash';
+export class AuthService {
+  login() {}
+}
`;

describe("semantic-adapters", () => {
  it("maps semantic analysis to symbol changes", () => {
    const parsed = parseUnifiedDiff("src/auth.ts", TS_PATCH);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    const symbols = mapSemanticToSymbolChanges(semantic, 20);

    expect(symbols.some((s) => s.name === "AuthService" && s.kind === "class")).toBe(
      true,
    );
    expect(symbols.some((s) => s.name === "login")).toBe(true);
  });

  it("maps semantic imports to internal edges", () => {
    const parsed = parseUnifiedDiff("src/index.ts", TS_PATCH);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    const edges = mapSemanticToImportEdges("src/index.ts", semantic, [
      "src/index.ts",
      "src/hash.ts",
    ]);

    expect(edges.some((e) => e.edgeType === "internal")).toBe(true);
  });
});
