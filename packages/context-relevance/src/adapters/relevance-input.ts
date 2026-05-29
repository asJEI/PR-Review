import type { RelevanceInput, RelevanceOptions } from "@pr-review/shared";

import { resolveRelevanceOptions } from "../pipeline/defaults.js";
import type { RelevanceState } from "../pipeline/types.js";

export function initRelevanceState(
  input: RelevanceInput,
  options?: RelevanceOptions,
): RelevanceState {
  return {
    input,
    options: resolveRelevanceOptions(options),
    fileScores: new Map(),
    symbolScores: [],
    moduleScores: [],
    budget: null,
    report: null,
  };
}
