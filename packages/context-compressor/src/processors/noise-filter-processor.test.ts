import type { ReviewContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { initCompressionState } from "../adapters/review-context-input.js";
import { NoiseFilterProcessor } from "./noise-filter-processor.js";

function buildFixture(): ReviewContext {
  return {
    source: { owner: "acme", repo: "app", pullNumber: 1 },
    metadata: {
      number: 1,
      title: "Mixed PR",
      state: "open",
      author: "dev",
      baseRef: "main",
      headRef: "feature",
      additions: 10,
      deletions: 2,
      changedFiles: 3,
    },
    commitThemes: ["fix auth"],
    existingDiscussion: [],
    changeGroups: [],
    files: [
      {
        filename: "vendor/lib.js",
        status: "modified",
        language: "javascript",
        additions: 1,
        deletions: 0,
        symbols: [],
        imports: [],
        hunks: [
          {
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 1,
            header: "@@",
            contextLines: [],
            changeLines: [{ type: "add", content: "+x", oldLineNumber: null, newLineNumber: 1 }],
          },
        ],
        truncated: false,
      },
      {
        filename: "src/auth/service.ts",
        status: "modified",
        language: "typescript",
        additions: 5,
        deletions: 1,
        symbols: [{ name: "login", kind: "method", changeType: "modified" }],
        imports: [],
        hunks: [],
        truncated: false,
      },
    ],
    dependencyGraph: { nodes: [], edges: [] },
    semanticSummary: {
      primaryAreas: [],
      changeProfile: { added: 0, modified: 2, removed: 0, renamed: 0, languages: {} },
      symbolSummary: [],
      commitThemes: [],
      discussionHints: [],
      riskHints: [],
    },
    stats: {
      fileCount: 2,
      symbolCount: 1,
      estimatedTokens: 1000,
      skippedFiles: [],
      truncatedFiles: [],
    },
    modules: [
      {
        module: "src/auth",
        affectedFunctions: [{ name: "login", kind: "method", changeType: "modified" }],
        relatedFiles: ["vendor/lib.js", "src/auth/service.ts"],
        dependencies: [],
        expandedDependencies: [],
        callChainHints: [],
        riskContext: [],
        surroundingContext: [],
        semanticSummary: "auth",
      },
    ],
    builtAt: new Date().toISOString(),
  };
}

describe("NoiseFilterProcessor", () => {
  it("drops vendor noise files from active modules", () => {
    const processor = new NoiseFilterProcessor();
    const next = processor.process(initCompressionState(buildFixture()));

    expect(next.droppedFiles.has("vendor/lib.js")).toBe(true);
    expect(next.activeFiles.some((file) => file.filename === "vendor/lib.js")).toBe(false);
    expect(next.activeModules[0]?.relatedFiles).toEqual(["src/auth/service.ts"]);
  });
});
