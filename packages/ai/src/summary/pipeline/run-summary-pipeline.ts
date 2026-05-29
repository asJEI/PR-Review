import type { PrSummary, SummaryGeneratorInput } from "@pr-review/shared";

import { parseSummaryResponse } from "../parsers/summary-response-parser.js";
import { validateSummaryGrounding } from "../validators/context-grounding-validator.js";
import { getBaseProviderId, initSummaryState } from "./init-summary-state.js";
import type { SummaryGeneratorOptions } from "./defaults.js";

export async function runSummaryPipeline(
  input: SummaryGeneratorInput,
  options?: SummaryGeneratorOptions,
): Promise<PrSummary> {
  let state = initSummaryState(input, options);

  state.completion = await state.provider.complete({
    messages: [{ role: "user", content: input.summaryPrompt }],
    model: state.options.model,
    temperature: state.options.temperature,
    responseFormat: "json",
  });

  const baseOptions = {
    provider: getBaseProviderId(state.provider),
    model: state.completion.model,
    usage: state.completion.usage,
    groundingWarnings: [] as string[],
  };

  const parsed = parseSummaryResponse(
    state.completion.content,
    input.compressedContext,
    input.relevanceReport,
    baseOptions,
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
