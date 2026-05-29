import type { CompressionState } from "../pipeline/types.js";

/** Composable compression step (embedding/rerank-ready extension point). */
export interface CompressionProcessor {
  readonly id: string;
  process(state: CompressionState): CompressionState;
}
