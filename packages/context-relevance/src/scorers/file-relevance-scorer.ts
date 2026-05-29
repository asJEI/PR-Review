import type { FileRelevanceScore } from "@pr-review/shared";

import { classifyDepriority } from "../classifiers/depriority-classifier.js";
import {
  classifyPriority,
  compressionLevelForPriority,
} from "../classifiers/priority-classifier.js";
import { countImportHub, scoreChangeHeuristics } from "../heuristics/change-heuristics.js";
import { sumPathBoost } from "../heuristics/path-heuristics.js";
import {
  riskHintsForFile,
  scoreRiskHints,
} from "../heuristics/risk-boost-heuristics.js";
import type { RelevanceScorer } from "./relevance-scorer.js";
import { mergeReasons } from "../utils/explain.js";
import { clampScore, roundScore } from "../utils/normalize-score.js";
import type { RelevanceState } from "../pipeline/types.js";

function collectAllRiskHints(state: RelevanceState): string[] {
  const hints = new Set<string>();

  for (const hint of state.input.reviewContext.semanticSummary.riskHints) {
    hints.add(hint);
  }

  for (const module of state.input.reviewContext.modules) {
    for (const hint of module.riskContext) {
      hints.add(hint);
    }
  }

  for (const module of state.input.compressedContext?.modules ?? []) {
    for (const hint of module.riskContext) {
      hints.add(hint);
    }
  }

  return [...hints];
}

export class FileRelevanceScorer implements RelevanceScorer {
  readonly id = "file-relevance";

  score(state: RelevanceState): RelevanceState {
    const fileScores = new Map<string, FileRelevanceScore>();
    const allRiskHints = collectAllRiskHints(state);
    const { edges } = state.input.reviewContext.dependencyGraph;

    for (const file of state.input.reviewContext.files) {
      const depriority = classifyDepriority(file, allRiskHints);
      const fileHints = riskHintsForFile(file.filename, allRiskHints);
      const riskBoosts = scoreRiskHints(fileHints);
      const path = sumPathBoost(file.filename);
      const change = scoreChangeHeuristics(file);

      let score = 0.35;
      const reasons: string[][] = [];

      if (depriority.ignored) {
        fileScores.set(file.filename, {
          file: file.filename,
          relevanceScore: 0,
          priority: "ignored",
          reasons: depriority.reason ? [depriority.reason] : ["ignored file"],
          suggestedContextTokens: 0,
          compressionLevel: "aggressive",
        });
        continue;
      }

      score += path.boost;
      score += change.boost;
      score += riskBoosts.reduce((sum, boost) => sum + boost.boost, 0);

      if (countImportHub(file.filename, edges)) {
        score += 0.05;
        reasons.push(["internal import hub"]);
      }

      if (depriority.testOnlyLow) {
        score = Math.min(score, 0.35);
        reasons.push(["test-only low-signal change"]);
      }

      reasons.push(path.reasons, change.reasons, riskBoosts.map((boost) => boost.reason));

      const relevanceScore = roundScore(clampScore(score));
      const priority = classifyPriority(relevanceScore, false, riskBoosts);

      fileScores.set(file.filename, {
        file: file.filename,
        relevanceScore,
        priority,
        reasons: mergeReasons(...reasons),
        suggestedContextTokens: 0,
        compressionLevel: compressionLevelForPriority(priority),
      });
    }

    return { ...state, fileScores };
  }
}
