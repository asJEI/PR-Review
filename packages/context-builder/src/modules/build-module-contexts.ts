import type { EngineeringModuleContext, ImportEdge, SymbolChange } from "@pr-review/shared";

import { deriveModuleName } from "./module-naming.js";
import { buildModuleSummary } from "./module-summary.js";
import type { PipelineState } from "../pipeline/types.js";

const FUNCTION_KINDS = new Set(["function", "method"]);

function collectAffectedFunctions(
  files: string[],
  symbolsByFile: Map<string, SymbolChange[]>,
): SymbolChange[] {
  const result: SymbolChange[] = [];

  for (const file of files) {
    for (const symbol of symbolsByFile.get(file) ?? []) {
      if (FUNCTION_KINDS.has(symbol.kind)) {
        result.push(symbol);
      }
    }
  }

  return result;
}

function collectDependencies(
  files: string[],
  importsByFile: Map<string, ImportEdge[]>,
): ImportEdge[] {
  const fileSet = new Set(files);
  const edges: ImportEdge[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    for (const edge of importsByFile.get(file) ?? []) {
      if (edge.edgeType === "internal" && !fileSet.has(edge.to)) {
        continue;
      }

      const key = `${edge.from}->${edge.to}:${edge.kind}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      edges.push(edge);
    }
  }

  return edges;
}

function collectExpandedDependencies(
  files: string[],
  expandedDepsByFile: Map<string, string[]>,
): string[] {
  const merged = new Set<string>();

  for (const file of files) {
    for (const dep of expandedDepsByFile.get(file) ?? []) {
      merged.add(dep);
    }
  }

  return [...merged];
}

function filterCallChainHints(
  files: string[],
  hints: PipelineState["callChainHints"],
): PipelineState["callChainHints"] {
  const fileSet = new Set(files);

  return hints.filter(
    (hint) => fileSet.has(hint.fromFile) && fileSet.has(hint.toFile),
  );
}

function collectRiskContext(
  files: string[],
  riskByFile: PipelineState["riskByFile"],
): string[] {
  const hints = new Set<string>();

  for (const file of files) {
    for (const hint of riskByFile.get(file)?.riskHints ?? []) {
      hints.add(hint);
    }
  }

  return [...hints];
}

function collectSurroundingContext(
  files: string[],
  fileHunks: Map<string, EngineeringModuleContext["surroundingContext"]>,
  maxHunks: number,
): EngineeringModuleContext["surroundingContext"] {
  const hunks: EngineeringModuleContext["surroundingContext"] = [];

  for (const file of files) {
    for (const hunk of fileHunks.get(file) ?? []) {
      hunks.push(hunk);

      if (hunks.length >= maxHunks) {
        return hunks;
      }
    }
  }

  return hunks;
}

export function buildModuleContextsFromState(
  state: PipelineState,
): EngineeringModuleContext[] {
  const fileHunks = new Map(
    state.files.map((file) => [file.filename, file.hunks]),
  );

  return state.changeGroups.map((group) => {
    const module = deriveModuleName(group);
    const affectedFunctions = collectAffectedFunctions(
      group.files,
      state.symbolsByFile,
    );
    const dependencies = collectDependencies(
      group.files,
      state.importsByFile,
    );
    const expandedDependencies = collectExpandedDependencies(
      group.files,
      state.expandedDepsByFile,
    );
    const callChainHints = filterCallChainHints(
      group.files,
      state.callChainHints,
    );
    const riskContext = collectRiskContext(group.files, state.riskByFile);
    const surroundingContext = collectSurroundingContext(
      group.files,
      fileHunks,
      10,
    );
    const internalDepCount = dependencies.filter(
      (edge) => edge.edgeType === "internal",
    ).length;

    return {
      module,
      affectedFunctions,
      relatedFiles: [...group.files],
      dependencies,
      expandedDependencies,
      callChainHints,
      riskContext,
      surroundingContext,
      semanticSummary: buildModuleSummary(
        module,
        group,
        affectedFunctions,
        internalDepCount,
        riskContext,
      ),
    };
  });
}
