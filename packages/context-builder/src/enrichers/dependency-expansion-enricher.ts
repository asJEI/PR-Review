import type { ContextEnricher } from "./context-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

function expandOneHop(
  file: string,
  edges: PipelineState["dependencyGraph"]["edges"],
): string[] {
  const direct = edges
    .filter((edge) => edge.from === file)
    .map((edge) => edge.to);

  const expanded = new Set<string>(direct);

  for (const target of direct) {
    for (const edge of edges) {
      if (edge.from === target) {
        expanded.add(edge.to);
      }
    }
  }

  return [...expanded];
}

export class DependencyExpansionEnricher implements ContextEnricher {
  readonly id = "dependency-expansion";

  enrich(state: PipelineState): PipelineState {
    const expandedDepsByFile = new Map<string, string[]>();
    const { edges } = state.dependencyGraph;

    for (const entry of state.parsedFiles) {
      const filename = entry.changedFile.filename;
      const expanded = expandOneHop(filename, edges);

      const external = (state.importsByFile.get(filename) ?? [])
        .filter((edge) => edge.edgeType === "external")
        .map((edge) => edge.to);

      expandedDepsByFile.set(filename, [...new Set([...expanded, ...external])]);
    }

    return { ...state, expandedDepsByFile };
  }
}
