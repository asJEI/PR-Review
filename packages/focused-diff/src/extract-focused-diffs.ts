import type {
  FocusedDiffInput,
  FocusedDiffOptions,
  FocusedDiffReport,
} from "@pr-review/shared";

import { runExtractionPipeline } from "./pipeline/run-extraction-pipeline.js";

export function extractFocusedDiffs(
  input: FocusedDiffInput,
  options?: FocusedDiffOptions,
): FocusedDiffReport {
  return runExtractionPipeline(input, options);
}

export type {
  FocusedDiffInput,
  FocusedDiffItem,
  FocusedDiffOptions,
  FocusedDiffReport,
} from "@pr-review/shared";

export { runExtractionPipeline } from "./pipeline/run-extraction-pipeline.js";
