import type { PromptBuildState } from "../pipeline/types.js";

/** Composable prompt building step (multi-agent routing extension point). */
export interface PromptBuilder {
  readonly id: "summary" | "risk" | "review";
  build(state: PromptBuildState): PromptBuildState;
}
