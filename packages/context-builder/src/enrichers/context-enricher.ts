import type { PipelineState } from "../pipeline/types.js";

/** Composable context enrichment step (AST-ready extension point). */
export interface ContextEnricher {
  readonly id: string;
  enrich(state: PipelineState): PipelineState;
}
