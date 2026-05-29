import type { CallChainHint } from "@pr-review/shared";

import type { ContextEnricher } from "./context-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

export class CallChainEnricher implements ContextEnricher {
  readonly id = "call-chain";

  enrich(state: PipelineState): PipelineState {
    const hints: CallChainHint[] = [];
    const seen = new Set<string>();

    for (const edge of state.dependencyGraph.edges) {
      if (edge.edgeType !== "internal") {
        continue;
      }

      const key = `${edge.from}->${edge.to}:import`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      hints.push({
        fromFile: edge.from,
        toFile: edge.to,
        symbol: edge.to.split("/").pop() ?? edge.to,
        relationship: "import",
        confidence: 0.7,
      });
    }

    const symbolsByFile = new Map<string, Set<string>>();

    for (const [file, symbols] of state.symbolsByFile) {
      symbolsByFile.set(
        file,
        new Set(symbols.map((symbol) => symbol.name)),
      );
    }

    for (const fromFile of symbolsByFile.keys()) {
      const fromSymbols = symbolsByFile.get(fromFile) ?? new Set<string>();

      for (const [toFile, toSymbols] of symbolsByFile) {
        if (fromFile === toFile) {
          continue;
        }

        for (const symbol of fromSymbols) {
          if (!toSymbols.has(symbol)) {
            continue;
          }

          const key = `${fromFile}->${toFile}:${symbol}:symbol`;
          if (seen.has(key)) {
            continue;
          }

          seen.add(key);
          hints.push({
            fromFile,
            toFile,
            symbol,
            relationship: "symbolReference",
            confidence: 0.6,
          });
        }
      }
    }

    return { ...state, callChainHints: hints };
  }
}
