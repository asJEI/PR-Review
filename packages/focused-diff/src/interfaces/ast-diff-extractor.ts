export interface AstDiffExtractor {
  extractSymbolWindow(
    file: string,
    symbol: string,
  ): Promise<{ lines: string[] } | null>;
}

export class NoopAstDiffExtractor implements AstDiffExtractor {
  async extractSymbolWindow(): Promise<{ lines: string[] } | null> {
    return null;
  }
}
