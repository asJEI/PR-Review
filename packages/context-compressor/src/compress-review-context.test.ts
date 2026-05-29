import type { ReviewContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { compressReviewContext } from "./compress-review-context.js";

const FIXTURE: ReviewContext = {
  source: { owner: "acme", repo: "app", pullNumber: 1 },
  metadata: {
    number: 1,
    title: "Add auth",
    state: "open",
    author: "dev",
    baseRef: "main",
    headRef: "feature",
    additions: 10,
    deletions: 2,
    changedFiles: 2,
  },
  commitThemes: ["feat: add auth module"],
  existingDiscussion: [],
  changeGroups: [],
  files: [
    {
      filename: "src/auth/service.ts",
      status: "added",
      language: "typescript",
      additions: 8,
      deletions: 0,
      symbols: [
        { name: "AuthService", kind: "class", changeType: "added" },
        { name: "login", kind: "method", changeType: "added" },
      ],
      imports: [
        {
          from: "src/auth/service.ts",
          to: "src/auth/hash.ts",
          kind: "esm",
          edgeType: "internal",
        },
      ],
      hunks: [],
      truncated: false,
    },
    {
      filename: "package-lock.json",
      status: "modified",
      language: "unknown",
      additions: 100,
      deletions: 50,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: false,
    },
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: ["src/"],
    changeProfile: { added: 1, modified: 1, removed: 0, renamed: 0, languages: { typescript: 1 } },
    symbolSummary: ["method login (added)"],
    commitThemes: ["feat: add auth module"],
    discussionHints: [],
    riskHints: ["Auth logic changed in src/auth/service.ts"],
  },
  stats: {
    fileCount: 2,
    symbolCount: 2,
    estimatedTokens: 5000,
    skippedFiles: [],
    truncatedFiles: [],
  },
  modules: [
    {
      module: "src/auth",
      affectedFunctions: [{ name: "login", kind: "method", changeType: "added" }],
      relatedFiles: ["src/auth/service.ts", "package-lock.json"],
      dependencies: [],
      expandedDependencies: ["src/auth/hash.ts"],
      callChainHints: [],
      riskContext: ["Auth logic changed in src/auth/service.ts"],
      surroundingContext: [],
      semanticSummary: "src/auth: 2 files changed",
    },
  ],
  builtAt: new Date().toISOString(),
};

describe("compressReviewContext", () => {
  it("produces compressed modules without raw hunks", () => {
    const compressed = compressReviewContext(FIXTURE);

    expect(compressed.modules.length).toBeGreaterThan(0);
    expect(compressed.modules[0]?.coreChange).toBeTruthy();
    expect(compressed.modules[0]?.logicChanges.length).toBeGreaterThan(0);
    expect(compressed.stats.droppedFiles).toContain("package-lock.json");
    expect(compressed.stats.outputTokens).toBeLessThan(compressed.stats.inputTokens);
    expect(JSON.stringify(compressed)).not.toContain("surroundingContext");
  });

  it("respects token budget options", () => {
    const compressed = compressReviewContext(FIXTURE, { maxEstimatedTokens: 300 });

    expect(compressed.stats.outputTokens).toBeLessThanOrEqual(300);
  });
});
