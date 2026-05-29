import type { ParsedFileDiff } from "../types.js";
import { detectAsyncChanges } from "./extractors/async-extractor.js";
import { extractClasses } from "./extractors/class-extractor.js";
import { extractFunctions } from "./extractors/function-extractor.js";
import { extractExports, extractImports } from "./extractors/import-export-extractor.js";
import { extractInterfaces } from "./extractors/interface-extractor.js";
import type { SemanticExtractor } from "./interfaces/semantic-extractor.js";
import { getPatterns } from "./patterns/index.js";
import { EMPTY_SEMANTIC_ANALYSIS, type SemanticAnalysis } from "./types.js";

const SUPPORTED = new Set([
  "typescript",
  "javascript",
  "python",
  "unknown",
]);

export class RegexSemanticExtractor implements SemanticExtractor {
  readonly id = "regex";

  supports(language: string): boolean {
    return SUPPORTED.has(language);
  }

  analyze(parsed: ParsedFileDiff, language: string): SemanticAnalysis {
    if (parsed.isEmpty) {
      return { ...EMPTY_SEMANTIC_ANALYSIS };
    }

    const patterns = getPatterns(language);

    return {
      functions: extractFunctions(parsed, patterns),
      classes: extractClasses(parsed, patterns),
      imports: extractImports(parsed, patterns),
      exports: extractExports(parsed, patterns),
      interfaces: extractInterfaces(parsed, patterns),
      asyncChanges: detectAsyncChanges(parsed, patterns),
    };
  }
}
