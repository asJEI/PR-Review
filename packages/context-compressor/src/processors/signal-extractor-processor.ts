import { filterRelevantCommitThemes, matchCommitTheme } from "../signals/commit-intent-matcher.js";
import {
  extractDependencySignals,
  extractPathSignals,
} from "../signals/path-signals.js";
import { extractRiskSignals } from "../signals/risk-signals.js";
import { extractSemanticSignals } from "../signals/semantic-signals.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState, ExtractedSignal } from "../pipeline/types.js";

export class SignalExtractorProcessor implements CompressionProcessor {
  readonly id = "signal-extractor";

  process(state: CompressionState): CompressionState {
    const signalsByModule = new Map<string, ExtractedSignal[]>();
    const matchedCommitByModule = new Map<string, string>();
    const topLevelSignals = new Set<string>();

    for (const module of state.activeModules) {
      const moduleSignals: ExtractedSignal[] = [
        ...extractRiskSignals(module.riskContext),
        ...extractSemanticSignals(module.affectedFunctions),
        ...extractPathSignals(module.relatedFiles),
        ...extractDependencySignals(module.expandedDependencies),
      ];

      const matchedCommit = matchCommitTheme(
        state.input.commitThemes,
        module.relatedFiles,
      );

      if (matchedCommit) {
        matchedCommitByModule.set(module.module, matchedCommit);
        moduleSignals.push({
          kind: "commit",
          label: matchedCommit,
          weight: 18,
        });
      }

      signalsByModule.set(module.module, moduleSignals);

      for (const signal of moduleSignals) {
        topLevelSignals.add(signal.label);
      }
    }

    const relevantCommits = filterRelevantCommitThemes(
      state.input.commitThemes,
      state.activeModules,
    );

    return {
      ...state,
      signalsByModule,
      matchedCommitByModule,
      topLevelSignals: [...topLevelSignals].slice(0, 20),
      input: {
        ...state.input,
        commitThemes: relevantCommits,
      },
    };
  }
}
