import type { ModuleRelevanceScore } from "@pr-review/shared";

import { classifyPriority } from "../classifiers/priority-classifier.js";
import type { RelevanceScorer } from "./relevance-scorer.js";
import { mergeReasons } from "../utils/explain.js";
import { clampScore, roundScore } from "../utils/normalize-score.js";
import type { RelevanceState } from "../pipeline/types.js";

export class ModuleRelevanceScorer implements RelevanceScorer {
  readonly id = "module-relevance";

  score(state: RelevanceState): RelevanceState {
    const moduleScores: ModuleRelevanceScore[] = [];

    for (const module of state.input.reviewContext.modules) {
      const fileEntries = module.relatedFiles
        .map((file) => state.fileScores.get(file))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      const activeFiles = fileEntries.filter((entry) => entry.priority !== "ignored");

      if (activeFiles.length === 0) {
        continue;
      }

      const maxScore = Math.max(...activeFiles.map((entry) => entry.relevanceScore));
      const avgScore =
        activeFiles.reduce((sum, entry) => sum + entry.relevanceScore, 0) /
        activeFiles.length;
      const score = roundScore(clampScore(maxScore * 0.7 + avgScore * 0.3));

      const compressedModule = state.input.compressedContext?.modules.find(
        (entry) => entry.module === module.module,
      );

      const reasons = mergeReasons(
        activeFiles.flatMap((entry) => entry.reasons.slice(0, 2)),
        compressedModule ? [`core change: ${compressedModule.coreChange}`] : [],
      );

      const priority = classifyPriority(score, false);

      moduleScores.push({
        module: module.module,
        relevanceScore: score,
        priority,
        reasons,
        topFiles: [...activeFiles]
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5)
          .map((entry) => entry.file),
      });
    }

    moduleScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return { ...state, moduleScores };
  }
}
