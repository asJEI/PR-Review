import { describe, expect, it } from "vitest";

import { parseUnifiedDiff } from "../parse-unified-diff.js";
import { analyzeSemantics } from "../semantic/analyze-semantics.js";
import { analyzeRisk } from "./analyze-risk.js";

function assess(filename: string, patch: string, language = "typescript") {
  const parsed = parseUnifiedDiff(filename, patch);
  const semantic = analyzeSemantics(parsed, { language });

  return analyzeRisk({ filename, language, semantic, parsed });
}

describe("analyzeRisk", () => {
  it("detects authLogicChanged for auth path and login symbol", () => {
    const patch = `@@ -0,0 +1,3 @@
+export function login() {
+  return verifyToken();
+}
`;
    const result = assess("src/auth/service.ts", patch);

    const finding = result.findings.find((f) => f.id === "authLogicChanged");
    expect(finding).toBeDefined();
    expect(finding?.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.riskHints.length).toBeGreaterThan(0);
  });

  it("detects databaseOperationModified for prisma query changes", () => {
    const patch = `@@ -1,1 +1,1 @@
-await prisma.user.findMany()
+await prisma.user.findFirst()
`;
    const result = assess("src/db/user-repo.ts", patch);

    expect(result.findings.some((f) => f.id === "databaseOperationModified")).toBe(
      true,
    );
  });

  it("detects cacheLayerTouched for redis import", () => {
    const patch = `@@ -0,0 +1,1 @@
+import Redis from 'ioredis';
`;
    const result = assess("src/cache/client.ts", patch);

    expect(result.findings.some((f) => f.id === "cacheLayerTouched")).toBe(true);
  });

  it("detects asyncIntroduced for sync to async change", () => {
    const patch = `@@ -1,2 +1,2 @@
-function fetchData() {
+async function fetchData() {
`;
    const result = assess("src/api.ts", patch);

    expect(result.findings.some((f) => f.id === "asyncIntroduced")).toBe(true);
    expect(result.riskHints.some((hint) => hint.includes("Async"))).toBe(true);
  });

  it("detects errorHandlingRemoved when try/catch is deleted", () => {
    const patch = `@@ -1,4 +1,1 @@
-try {
-  doWork();
-} catch (error) {
-}
+doWork();
`;
    const result = assess("src/worker.ts", patch);

    expect(result.findings.some((f) => f.id === "errorHandlingRemoved")).toBe(true);
  });

  it("detects concurrencyRisk when lock keyword and async change coexist", () => {
    const patch = `@@ -1,3 +1,3 @@
-function acquireLock() {
+async function acquireLock() {
   mutex.lock();
`;
    const result = assess("src/concurrent/lock.ts", patch);

    expect(result.findings.some((f) => f.id === "concurrencyRisk")).toBe(true);
  });

  it("returns empty risk for null patch", () => {
    const parsed = parseUnifiedDiff("empty.ts", null);
    const semantic = analyzeSemantics(parsed);

    const result = analyzeRisk({
      filename: "empty.ts",
      language: "typescript",
      semantic,
      parsed,
    });

    expect(result.riskHints).toHaveLength(0);
    expect(result.findings).toHaveLength(0);
  });

  it("filters hints by minConfidence", () => {
    const patch = `@@ -0,0 +1,1 @@
+// minor comment in migrations folder
`;
    const parsed = parseUnifiedDiff("src/db/migrations/readme.md", patch);
    const semantic = analyzeSemantics(parsed, { language: "typescript" });

    const lowThreshold = analyzeRisk(
      { filename: parsed.filename, language: "typescript", semantic, parsed },
      { minConfidence: 0.6 },
    );
    const highThreshold = analyzeRisk(
      { filename: parsed.filename, language: "typescript", semantic, parsed },
      { minConfidence: 0.9 },
    );

    expect(lowThreshold.riskHints.length).toBeGreaterThanOrEqual(
      highThreshold.riskHints.length,
    );
  });
});
