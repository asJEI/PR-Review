import { HeuristicSymbolExtractor } from "../../parsers/heuristic-symbol-extractor.js";
import type { PipelineState } from "../types.js";

const defaultExtractor = new HeuristicSymbolExtractor();

export function extractSymbols(state: PipelineState): PipelineState {
  const symbolsByFile = new Map<string, import("@pr-review/shared").SymbolChange[]>();

  for (const entry of state.parsedFiles) {
    const symbols = defaultExtractor.extract({
      filename: entry.changedFile.filename,
      language: entry.language,
      parsedDiff: entry.parsedDiff,
      maxSymbols: state.options.maxSymbolsPerFile,
    });

    symbolsByFile.set(entry.changedFile.filename, symbols);
  }

  return { ...state, symbolsByFile };
}
