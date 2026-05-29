import { buildModuleContextsFromState } from "../../modules/build-module-contexts.js";
import type { PipelineState } from "../types.js";

export function buildModuleContexts(state: PipelineState): PipelineState {
  const modules = buildModuleContextsFromState(state);

  return { ...state, modules };
}
