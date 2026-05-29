import { parseUnifiedDiff } from "../parse-unified-diff.js";
import type { ParsedFileDiff } from "../types.js";
import { detectLanguage } from "./detect-language.js";
import type { SemanticExtractor } from "./interfaces/semantic-extractor.js";
import { RegexSemanticExtractor } from "./regex-semantic-extractor.js";
import { EMPTY_SEMANTIC_ANALYSIS, type SemanticAnalysis } from "./types.js";

export interface AnalyzeSemanticsOptions {
  /** Language id (typescript, javascript, python). Inferred from filename when omitted. */
  language?: string;
  /** Custom extractor (e.g. future Tree-sitter). Defaults to RegexSemanticExtractor. */
  extractor?: SemanticExtractor;
}

const defaultExtractor = new RegexSemanticExtractor();

export function analyzeSemantics(
  parsed: ParsedFileDiff,
  options: AnalyzeSemanticsOptions = {},
): SemanticAnalysis {
  if (parsed.isEmpty) {
    return { ...EMPTY_SEMANTIC_ANALYSIS };
  }

  const language =
    options.language ?? detectLanguage(parsed.filename);
  const extractor = options.extractor ?? defaultExtractor;

  if (!extractor.supports(language)) {
    return defaultExtractor.analyze(parsed, language);
  }

  return extractor.analyze(parsed, language);
}

export interface ParsedFileDiffWithSemantic extends ParsedFileDiff {
  semantic: SemanticAnalysis;
}

/** Parses patch and runs semantic analysis in one step. */
export function parseAndAnalyze(
  filename: string,
  patch: string | null,
  options?: AnalyzeSemanticsOptions,
): ParsedFileDiffWithSemantic {
  const parsed = parseUnifiedDiff(filename, patch);

  return {
    ...parsed,
    semantic: analyzeSemantics(parsed, {
      ...options,
      language: options?.language ?? detectLanguage(filename),
    }),
  };
}
