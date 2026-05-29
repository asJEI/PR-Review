import type { ReviewContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { initRelevanceState } from "../adapters/relevance-input.js";
import { FileRelevanceScorer } from "./file-relevance-scorer.js";

function buildFixture(): ReviewContext {
  return {
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
    commitThemes: [],
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
    modules: [],
    stats: {
      fileCount: 3,
      symbolCount: 1,
      estimatedTokens: 1000,
      skippedFiles: [],
      truncatedFiles: [],
    },
    builtAt: new Date().toISOString(),
  };
}

describe("FileRelevanceScorer", () => {
  it("ranks auth high and vendor ignored", () => {
    const state = new FileRelevanceScorer().score(initRelevanceState({ reviewContext: buildFixture() }));

    const auth = state.fileScores.get("src/auth/jwt.ts");
    const vendor = state.fileScores.get("vendor/react.js");
    const utils = state.fileScores.get("src/utils/format.ts");

    expect(auth?.priority).toMatch(/critical|high/);
    expect(vendor?.priority).toBe("ignored");
    expect((auth?.relevanceScore ?? 0) > (utils?.relevanceScore ?? 0)).toBe(true);
  });
});
