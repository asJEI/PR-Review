import type { ParsedFileDiff } from "../../types.js";
import type { SemanticAnalysis } from "../types.js";

/** Pluggable semantic analyzer (regex MVP; Tree-sitter later). */
export interface SemanticExtractor {
  readonly id: string;
  supports(language: string): boolean;
  analyze(parsed: ParsedFileDiff, language: string): SemanticAnalysis;
}
