import { buildDependencyGraph } from "../../graph/file-dependency-graph.js";
import type { PipelineState } from "../types.js";

export function buildDependencyGraphStage(
  state: PipelineState,
): PipelineState {
  const dependencyGraph = buildDependencyGraph(state.importsByFile);

  return { ...state, dependencyGraph };
}
