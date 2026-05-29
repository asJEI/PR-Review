import { mapSemanticToSymbolChanges } from "../../adapters/semantic-adapters.js";
import type { PipelineState } from "../types.js";

export function extractSymbols(state: PipelineState): PipelineState {
  const symbolsByFile = new Map<string, import("@pr-review/shared").SymbolChange[]>();

  for (const entry of state.parsedFiles) {
    const symbols = mapSemanticToSymbolChanges(
      entry.semantic,
      state.options.maxSymbolsPerFile,
    );

    symbolsByFile.set(entry.changedFile.filename, symbols);
  }

  return { ...state, symbolsByFile };
}
