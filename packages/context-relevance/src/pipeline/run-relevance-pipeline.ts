import type { RelevanceInput, RelevanceOptions, RelevanceReport } from "@pr-review/shared";

import { initRelevanceState } from "../adapters/relevance-input.js";
import { buildRelevanceReport } from "../budget/context-budget-allocator.js";
import { runScorers } from "../scorers/run-scorers.js";

export function runRelevancePipeline(
  input: RelevanceInput,
  options?: RelevanceOptions,
): RelevanceReport {
  let state = initRelevanceState(input, options);
  state = runScorers(state);

  if (state.report) {
    return state.report;
  }

  return buildRelevanceReport(state);
}
