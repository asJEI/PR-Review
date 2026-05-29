import type { RelevanceState } from "../pipeline/types.js";

/** Composable relevance scoring step (ML rerank-ready extension point). */
export interface RelevanceScorer {
  readonly id: string;
  score(state: RelevanceState): RelevanceState;
}
