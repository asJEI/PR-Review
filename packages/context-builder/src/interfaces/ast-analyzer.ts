export interface AstSymbol {
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
}

export interface AstAnalysisResult {
  symbols: AstSymbol[];
  imports: string[];
}

/**
 * Future hook for tree-sitter / TypeScript compiler API.
 * MVP uses NoopAstAnalyzer — pipeline relies on heuristic extractors only.
 */
export interface AstAnalyzer {
  readonly id: string;
  supports(language: string): boolean;
  analyze(source: string, filePath: string): AstAnalysisResult;
}

export class NoopAstAnalyzer implements AstAnalyzer {
  readonly id = "noop";

  supports(_language: string): boolean {
    return false;
  }

  analyze(_source: string, _filePath: string): AstAnalysisResult {
    return { symbols: [], imports: [] };
  }
}
