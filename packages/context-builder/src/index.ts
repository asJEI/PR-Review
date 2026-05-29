export { buildReviewContext } from "./build-review-context.js";

export { DEFAULT_BUILD_OPTIONS, resolveBuildOptions } from "./pipeline/defaults.js";

export type { SymbolExtractor, SymbolExtractorInput } from "./interfaces/symbol-extractor.js";
export { HeuristicSymbolExtractor } from "./parsers/heuristic-symbol-extractor.js";
export type { AstAnalyzer, AstAnalysisResult, AstSymbol } from "./interfaces/ast-analyzer.js";
export { NoopAstAnalyzer } from "./interfaces/ast-analyzer.js";
export type { FileContentResolver } from "./interfaces/file-content-resolver.js";

export type {
  BuildContextOptions,
  ChangeGroup,
  FileContext,
  ImportEdge,
  ReviewContext,
  SemanticSummary,
  SymbolChange,
} from "@pr-review/shared";
