import type { CompressedModuleContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { initCompressionState } from "../adapters/review-context-input.js";
import { TokenBudgetProcessor } from "./token-budget-processor.js";

function largeModule(name: string, protectedRisk = false): CompressedModuleContext {
  return {
    module: name,
    coreChange: `${name} change`.repeat(20),
    affectedFunctions: [],
    logicChanges: Array.from({ length: 10 }, (_, index) => ({
      symbol: `fn${index}`,
      kind: "function",
      changeType: "modified",
      whatChanged: `Modified function fn${index}`.repeat(5),
      whyItMatters: "Review impact".repeat(5),
      riskSignals: protectedRisk ? ["Auth logic changed"] : [],
    })),
    dependencies: [],
    expandedDependencies: Array.from({ length: 10 }, (_, index) => `dep${index}`),
    architecturalImpact: Array.from({ length: 5 }, (_, index) => `impact ${index}`.repeat(4)),
    riskContext: protectedRisk ? ["Auth logic changed"] : [],
    priorityScore: protectedRisk ? 90 : 10,
  };
}

describe("TokenBudgetProcessor", () => {
  it("keeps protected-risk modules when trimming for budget", () => {
    const state = initCompressionState({
      source: { owner: "a", repo: "b", pullNumber: 1 },
      metadata: {
        number: 1,
        title: "t",
        state: "open",
        author: "dev",
        baseRef: "main",
        headRef: "feature",
        additions: 1,
        deletions: 0,
        changedFiles: 2,
      },
      commitThemes: [],
      existingDiscussion: [],
      changeGroups: [],
      files: [],
      dependencyGraph: { nodes: [], edges: [] },
      semanticSummary: {
        primaryAreas: [],
        changeProfile: { added: 0, modified: 0, removed: 0, renamed: 0, languages: {} },
        symbolSummary: [],
        commitThemes: [],
        discussionHints: [],
        riskHints: [],
      },
      stats: {
        fileCount: 0,
        symbolCount: 0,
        estimatedTokens: 99999,
        skippedFiles: [],
        truncatedFiles: [],
      },
      modules: [],
      builtAt: new Date().toISOString(),
    }, { maxEstimatedTokens: 800 });

    state.compressedModules = [
      largeModule("auth", true),
      largeModule("docs", false),
      largeModule("misc", false),
    ];

    const next = new TokenBudgetProcessor().process(state);

    expect(next.output?.modules.some((module) => module.module === "auth")).toBe(true);
    expect(next.output?.stats.outputTokens).toBeLessThanOrEqual(800);
  });
});
