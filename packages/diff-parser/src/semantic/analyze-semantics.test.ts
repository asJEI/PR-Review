import { describe, expect, it } from "vitest";

import { parseUnifiedDiff } from "../parse-unified-diff.js";
import { analyzeSemantics } from "./analyze-semantics.js";

describe("analyzeSemantics", () => {
  it("detects added class and function in TypeScript", () => {
    const patch = `@@ -0,0 +1,6 @@
+import { hash } from './hash';
+export class AuthService {
+  async login() {
+    return true;
+  }
+}
`;
    const parsed = parseUnifiedDiff("src/auth.ts", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    expect(semantic.classes.some((c) => c.name === "AuthService" && c.changeType === "added")).toBe(true);
    expect(semantic.functions.some((f) => f.name === "login")).toBe(true);
    expect(semantic.imports.added).toContain("./hash");
  });

  it("detects import added and removed", () => {
    const patch = `@@ -1,2 +1,2 @@
-import { old } from './old';
+import { neu } from './new';
`;
    const parsed = parseUnifiedDiff("src/index.ts", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    expect(semantic.imports.removed.some((s) => s.includes("old"))).toBe(true);
    expect(semantic.imports.added.some((s) => s.includes("new"))).toBe(true);
  });

  it("detects export removal", () => {
    const patch = `@@ -1,1 +0,0 @@
-export { foo } from './foo';
`;
    const parsed = parseUnifiedDiff("src/index.ts", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    expect(semantic.exports.removed.length).toBeGreaterThan(0);
  });

  it("detects added interface", () => {
    const patch = `@@ -0,0 +1,2 @@
+export interface UserDto {
+  id: string;
+}
`;
    const parsed = parseUnifiedDiff("src/types.ts", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    expect(
      semantic.interfaces.some(
        (i) => i.name === "UserDto" && i.kind === "interface" && i.changeType === "added",
      ),
    ).toBe(true);
  });

  it("detects async keyword change", () => {
    const patch = `@@ -1,2 +1,2 @@
-function fetchData() {
+async function fetchData() {
`;
    const parsed = parseUnifiedDiff("src/api.ts", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    expect(semantic.asyncChanges).toBe(true);
    expect(
      semantic.functions.some(
        (f) => f.name === "fetchData" && f.changeType === "modified",
      ),
    ).toBe(true);
  });

  it("returns empty semantic for null patch", () => {
    const parsed = parseUnifiedDiff("img.png", null);
    const semantic = analyzeSemantics(parsed);

    expect(semantic.functions).toHaveLength(0);
    expect(semantic.classes).toHaveLength(0);
    expect(semantic.imports.added).toHaveLength(0);
    expect(semantic.exports.removed).toHaveLength(0);
    expect(semantic.interfaces).toHaveLength(0);
    expect(semantic.asyncChanges).toBe(false);
  });
});
