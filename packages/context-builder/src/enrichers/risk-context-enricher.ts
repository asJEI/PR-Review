import { analyzeRisk } from "@pr-review/diff-parser";

import { filterRiskForFile } from "../utils/risk-filter.js";
import type { ContextEnricher } from "./context-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

export class RiskContextEnricher implements ContextEnricher {
  readonly id = "risk-context";

  enrich(state: PipelineState): PipelineState {
    const riskByFile = new Map(state.riskByFile);

    for (const entry of state.parsedFiles) {
      const filename = entry.changedFile.filename;
      const raw = analyzeRisk({
        filename,
        language: entry.language,
        semantic: entry.semantic,
        parsed: entry.parsedDiff,
      });

      riskByFile.set(
        filename,
        filterRiskForFile(raw, filename, entry.language),
      );
    }

    return { ...state, riskByFile };
  }
}
