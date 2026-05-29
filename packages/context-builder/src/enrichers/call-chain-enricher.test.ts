import { describe, expect, it } from "vitest";

import { CallChainEnricher } from "./call-chain-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

describe("CallChainEnricher", () => {
  it("emits import and shared-symbol hints", () => {
    const state: PipelineState = {
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
      parsedFiles: [],
      symbolsByFile: new Map([
        [
          "src/a.ts",
          [{ name: "sharedFn", kind: "function", changeType: "added" }],
        ],
        [
          "src/b.ts",
          [{ name: "sharedFn", kind: "function", changeType: "modified" }],
        ],
      ]),
      importsByFile: new Map(),
      dependencyGraph: {
        nodes: ["src/a.ts", "src/b.ts"],
        edges: [
          {
            from: "src/a.ts",
            to: "src/b.ts",
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
    };

    const next = new CallChainEnricher().enrich(state);

    expect(next.callChainHints.some((hint) => hint.relationship === "import")).toBe(
      true,
    );
    expect(
      next.callChainHints.some(
        (hint) =>
          hint.relationship === "symbolReference" && hint.symbol === "sharedFn",
      ),
    ).toBe(true);
  });
});
