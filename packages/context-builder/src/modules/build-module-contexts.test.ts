import { describe, expect, it } from "vitest";

import { buildModuleContextsFromState } from "./build-module-contexts.js";
import type { PipelineState } from "../pipeline/types.js";

describe("buildModuleContextsFromState", () => {
  it("aggregates module fields from change groups", () => {
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
          "src/auth/service.ts",
          [{ name: "login", kind: "method", changeType: "added" }],
        ],
      ]),
      importsByFile: new Map([
        [
          "src/auth/service.ts",
          [
            {
              from: "src/auth/service.ts",
              to: "src/auth/hash.ts",
              kind: "esm",
              edgeType: "internal",
            },
          ],
        ],
      ]),
      dependencyGraph: { nodes: [], edges: [] },
      changeGroups: [
        {
          id: "group-1",
          label: "src/auth/",
          files: ["src/auth/service.ts", "src/auth/hash.ts"],
          rationale: "directory",
        },
      ],
      semanticSummary: {} as PipelineState["semanticSummary"],
      files: [
        {
          filename: "src/auth/service.ts",
          status: "added",
          language: "typescript",
          additions: 1,
          deletions: 0,
          symbols: [],
          imports: [],
          hunks: [
            {
              oldStart: 1,
              oldLines: 0,
              newStart: 1,
              newLines: 1,
              header: "@@",
              contextLines: [],
              changeLines: [],
            },
          ],
          truncated: false,
        },
      ],
      skippedFiles: [],
      truncatedFiles: [],
      riskByFile: new Map([
        [
          "src/auth/service.ts",
          { findings: [], riskHints: ["Auth logic changed"] },
        ],
      ]),
      expandedDepsByFile: new Map([
        ["src/auth/service.ts", ["src/auth/hash.ts"]],
      ]),
      callChainHints: [
        {
          fromFile: "src/auth/service.ts",
          toFile: "src/auth/hash.ts",
          symbol: "hash.ts",
          relationship: "import",
          confidence: 0.7,
        },
      ],
      enrichedHunksByFile: new Map(),
      modules: [],
    };

    const modules = buildModuleContextsFromState(state);

    expect(modules).toHaveLength(1);
    expect(modules[0]?.module).toBe("src/auth");
    expect(modules[0]?.affectedFunctions[0]?.name).toBe("login");
    expect(modules[0]?.riskContext).toContain("Auth logic changed");
    expect(modules[0]?.semanticSummary).toContain("src/auth");
  });
});
