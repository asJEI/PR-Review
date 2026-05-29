export { extractFocusedDiffs } from "./extract-focused-diffs.js";
export type {
  FocusedDiffInput,
  FocusedDiffItem,
  FocusedDiffOptions,
  FocusedDiffReport,
} from "@pr-review/shared";
export { runExtractionPipeline } from "./pipeline/run-extraction-pipeline.js";
export { NoopAstDiffExtractor } from "./interfaces/ast-diff-extractor.js";
export type { AstDiffExtractor } from "./interfaces/ast-diff-extractor.js";
