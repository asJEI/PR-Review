import type { ReviewContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { initRelevanceState } from "../adapters/relevance-input.js";
import { FileRelevanceScorer } from "./file-relevance-scorer.js";
import { SymbolRelevanceScorer } from "./symbol-relevance-scorer.js";

describe("SymbolRelevanceScorer", () => {
  it("ranks exported handler above internal utility symbol", () => {
    const reviewContext: ReviewContext = {
      source: { owner: "acme", repo: "app", pullNumber: 1 },
      metadata: {
        number: 1,
        title: "t",
        state: "open",
        author: "dev",
        baseRef: "main",
        headRef: "feature",
        additions: 1,
        deletions: 0,
        changedFiles: 1,
      },
      commitThemes: [],
      existingDiscussion: [],
      changeGroups: [],
      files: [
        {
          filename: "src/api/handler.ts",
          status: "modified",
          language: "typescript",
          additions: 5,
          deletions: 1,
          symbols: [
            { name: "handleRequest", kind: "function", changeType: "modified" },
            { name: "_normalize", kind: "function", changeType: "modified" },
          ],
          imports: [],
          hunks: [],
          truncated: false,
        },
      ],
      dependencyGraph: { nodes: [], edges: [] },
      semanticSummary: {
        primaryAreas: [],
        changeProfile: { added: 0, modified: 1, removed: 0, renamed: 0, languages: {} },
        symbolSummary: [],
        commitThemes: [],
        discussionHints: [],
        riskHints: [],
      },
      modules: [],
      stats: {
        fileCount: 1,
        symbolCount: 2,
        estimatedTokens: 100,
        skippedFiles: [],
        truncatedFiles: [],
      },
      builtAt: new Date().toISOString(),
    };

    let state = initRelevanceState({ reviewContext });
    state = new FileRelevanceScorer().score(state);
    state = new SymbolRelevanceScorer().score(state);

    const handler = state.symbolScores.find((entry) => entry.symbol === "handleRequest");
    const util = state.symbolScores.find((entry) => entry.symbol === "_normalize");

    expect((handler?.relevanceScore ?? 0) > (util?.relevanceScore ?? 0)).toBe(true);
  });
});
