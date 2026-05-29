import type { SymbolRelevanceScore } from "@pr-review/shared";

import { classifyPriority } from "../classifiers/priority-classifier.js";
import { scoreRiskHints } from "../heuristics/risk-boost-heuristics.js";
import { sumSymbolBoost } from "../heuristics/symbol-heuristics.js";
import type { RelevanceScorer } from "./relevance-scorer.js";
import { mergeReasons } from "../utils/explain.js";
import { clampScore, roundScore } from "../utils/normalize-score.js";
import type { RelevanceState } from "../pipeline/types.js";

export class SymbolRelevanceScorer implements RelevanceScorer {
  readonly id = "symbol-relevance";

  score(state: RelevanceState): RelevanceState {
    const symbolScores: SymbolRelevanceScore[] = [];
    const allRiskHints = [
      ...state.input.reviewContext.semanticSummary.riskHints,
      ...state.input.reviewContext.modules.flatMap((module) => module.riskContext),
    ];

    for (const file of state.input.reviewContext.files) {
      const fileScore = state.fileScores.get(file.filename);

      if (!fileScore || fileScore.priority === "ignored") {
        continue;
      }

      for (const symbol of file.symbols) {
        const symbolHeuristics = sumSymbolBoost(symbol);
        const symbolHints = allRiskHints.filter((hint) =>
          hint.toLowerCase().includes(symbol.name.toLowerCase()),
        );
        const riskBoosts = scoreRiskHints(symbolHints);

        let score = fileScore.relevanceScore * 0.5;
        score += symbolHeuristics.boost;
        score += riskBoosts.reduce((sum, boost) => sum + boost.boost, 0);

        const relevanceScore = roundScore(clampScore(score));
        const priority = classifyPriority(relevanceScore, false, riskBoosts);

        symbolScores.push({
          file: file.filename,
          symbol: symbol.name,
          kind: symbol.kind,
          changeType: symbol.changeType,
          relevanceScore,
          priority,
          reasons: mergeReasons(
            symbolHeuristics.reasons,
            riskBoosts.map((boost) => boost.reason),
            [`inherits file relevance from ${file.filename}`],
          ),
        });
      }
    }

    symbolScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return { ...state, symbolScores };
  }
}
