import { describe, expect, it } from "vitest";

import { DependencyExpansionEnricher } from "./dependency-expansion-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

function baseState(
  overrides: Partial<PipelineState> = {},
): PipelineState {
  return {
    input: {} as PipelineState["input"],
    options: {
      maxEstimatedTokens: 12_000,
      maxContextLinesPerHunk: 8,
      maxSymbolsPerFile: 20,
      includeExistingComments: true,
    },
    metadata: {} as PipelineState["metadata"],
    commitThemes: [],
    existingDiscussion: [],
    parsedFiles: [
      {
        changedFile: {
          filename: "src/a.ts",
          status: "modified",
          additions: 1,
          deletions: 0,
          changes: 1,
          patch: "",
          blobUrl: "",
          rawUrl: "",
        },
        parsedDiff: { filename: "src/a.ts", hunks: [], isEmpty: false },
        semantic: {
          functions: [],
          classes: [],
          interfaces: [],
          imports: [],
          exports: [],
          asyncChanges: [],
        },
        language: "typescript",
      },
    ],
    symbolsByFile: new Map(),
    importsByFile: new Map([
      [
        "src/a.ts",
        [
          {
            from: "src/a.ts",
            to: "lodash",
            kind: "esm",
            edgeType: "external",
          },
        ],
      ],
    ]),
    dependencyGraph: {
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [
        {
          from: "src/a.ts",
          to: "src/b.ts",
          kind: "esm",
          edgeType: "internal",
        },
        {
          from: "src/b.ts",
          to: "src/c.ts",
          kind: "esm",
          edgeType: "internal",
        },
      ],
    },
    changeGroups: [],
    semanticSummary: {} as PipelineState["semanticSummary"],
    files: [],
    skippedFiles: [],
    truncatedFiles: [],
    riskByFile: new Map(),
    expandedDepsByFile: new Map(),
    callChainHints: [],
    enrichedHunksByFile: new Map(),
    modules: [],
    ...overrides,
  };
}

describe("DependencyExpansionEnricher", () => {
  it("expands internal dependencies by one hop and includes external modules", () => {
    const enricher = new DependencyExpansionEnricher();
    const next = enricher.enrich(baseState());

    expect(next.expandedDepsByFile.get("src/a.ts")).toEqual(
      expect.arrayContaining(["src/b.ts", "src/c.ts", "lodash"]),
    );
  });
});
