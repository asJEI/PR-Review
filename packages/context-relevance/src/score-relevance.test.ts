import type { ReviewContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { scoreRelevance } from "./score-relevance.js";

const FIXTURE: ReviewContext = {
  source: { owner: "acme", repo: "app", pullNumber: 1 },
  metadata: {
    number: 1,
    title: "Auth update",
    state: "open",
    author: "dev",
    baseRef: "main",
    headRef: "feature",
    additions: 20,
    deletions: 2,
    changedFiles: 3,
  },
  commitThemes: ["feat: jwt refresh"],
  existingDiscussion: [],
  changeGroups: [],
  files: [
    {
      filename: "src/auth/jwt.ts",
      status: "modified",
      language: "typescript",
      additions: 10,
      deletions: 1,
      symbols: [{ name: "verifyToken", kind: "function", changeType: "modified" }],
      imports: [],
      hunks: [],
      truncated: false,
    },
    {
      filename: "vendor/react.js",
      status: "modified",
      language: "javascript",
      additions: 1,
      deletions: 0,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: false,
    },
    {
      filename: "src/utils/format.ts",
      status: "modified",
      language: "typescript",
      additions: 2,
      deletions: 1,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: false,
    },
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: [],
    changeProfile: { added: 0, modified: 3, removed: 0, renamed: 0, languages: {} },
    symbolSummary: [],
    commitThemes: [],
    discussionHints: [],
    riskHints: ["Auth logic changed in src/auth/jwt.ts"],
  },
  modules: [
    {
      module: "src/auth",
      affectedFunctions: [{ name: "verifyToken", kind: "function", changeType: "modified" }],
      relatedFiles: ["src/auth/jwt.ts"],
      dependencies: [],
      expandedDependencies: [],
      callChainHints: [],
      riskContext: ["Auth logic changed in src/auth/jwt.ts"],
      surroundingContext: [],
      semanticSummary: "auth changes",
    },
  ],
  stats: {
    fileCount: 3,
    symbolCount: 1,
    estimatedTokens: 1000,
    skippedFiles: [],
    truncatedFiles: [],
  },
  builtAt: new Date().toISOString(),
};

describe("scoreRelevance", () => {
  it("returns ranked files, symbols, and budget allocation", () => {
    const report = scoreRelevance({ reviewContext: FIXTURE });

    expect(report.rankedFileOrder[0]).toBe("src/auth/jwt.ts");
    expect(report.files.find((file) => file.file === "vendor/react.js")?.priority).toBe("ignored");
    expect(report.symbols.length).toBeGreaterThan(0);
    expect(report.modules.length).toBeGreaterThan(0);
    expect(report.budget.fileAllocations.length).toBeGreaterThan(0);
    expect(report.stats.ignoredCount).toBeGreaterThan(0);
  });
});
