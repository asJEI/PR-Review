import type { PrSummary, SummaryGeneratorInput } from "@pr-review/shared";

import { normalizeToPrSummary } from "../parsers/summary-response-parser.js";
import { validateSummaryGrounding } from "../validators/context-grounding-validator.js";
import { initSummaryState } from "./init-summary-state.js";
import type { SummaryGeneratorOptions } from "./defaults.js";

export async function runSummaryPipeline(
  input: SummaryGeneratorInput,
  options?: SummaryGeneratorOptions,
): Promise<PrSummary> {
  let state = initSummaryState(input, options);

  const llmResult = await state.llmClient.generateSummary(input.summaryPrompt, {
    model: state.options.model,
    temperature: state.options.temperature,
  });

  const parsed = normalizeToPrSummary(
    llmResult.result,
    input.compressedContext,
    input.relevanceReport,
    {
      provider: llmResult.provider,
      model: llmResult.model,
      usage: llmResult.usage,
      latencyMs: llmResult.latencyMs,
      estimatedCostUsd: llmResult.usage.estimatedCostUsd,
      groundingWarnings: [],
    },
  );

  const grounding = validateSummaryGrounding(
    parsed,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  state.summary = {
    ...parsed,
    meta: {
      ...parsed.meta,
      groundingWarnings: grounding.warnings,
    },
  };

  return state.summary;
}
