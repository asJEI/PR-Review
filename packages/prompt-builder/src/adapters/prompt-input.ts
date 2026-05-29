import type { PromptBuildInput, PromptBuildOptions } from "@pr-review/shared";

import { resolvePromptBuildOptions } from "../pipeline/defaults.js";
import type { MergedModuleContext, PromptBuildState } from "../pipeline/types.js";

function collectRiskSignals(input: PromptBuildInput): string[] {
  const signals = new Set<string>();

  for (const hint of input.compressedContext.topLevelSignals) {
    signals.add(hint);
  }

  for (const module of input.compressedContext.modules) {
    for (const risk of module.riskContext) {
      signals.add(risk);
    }
    for (const change of module.logicChanges) {
      for (const signal of change.riskSignals) {
        signals.add(signal);
      }
    }
  }

  const semantic = input.reviewContext?.semanticSummary;
  if (semantic) {
    for (const hint of semantic.riskHints) {
      signals.add(hint);
    }
  }

  return [...signals];
}

function mergeModules(input: PromptBuildInput): MergedModuleContext[] {
  const relevanceByModule = new Map(
    input.relevanceReport.modules.map((module) => [module.module, module]),
  );

  return input.compressedContext.modules
    .map((compressed) => {
      const relevance = relevanceByModule.get(compressed.module);
      return {
        module: compressed.module,
        compressed,
        relevanceScore: relevance?.relevanceScore ?? compressed.priorityScore,
        priority: relevance?.priority ?? "medium",
        topFiles: relevance?.topFiles ?? [],
      };
    })
    .sort((left, right) => right.relevanceScore - left.relevanceScore);
}

export function initPromptBuildState(
  input: PromptBuildInput,
  options?: PromptBuildOptions,
): PromptBuildState {
  const fileScores = new Map(
    input.relevanceReport.files.map((file) => [file.file, file]),
  );

  return {
    input,
    options: resolvePromptBuildOptions(options),
    mergedModules: mergeModules(input),
    rankedFileOrder: [...input.relevanceReport.rankedFileOrder],
    rankedSymbolOrder: [...input.relevanceReport.rankedSymbolOrder],
    fileScores,
    symbolScores: [...input.relevanceReport.symbols],
    riskSignals: collectRiskSignals(input),
    semanticSummary: input.reviewContext?.semanticSummary ?? null,
    existingDiscussion: input.reviewContext?.existingDiscussion ?? [],
    summarySections: [],
    riskSections: [],
    reviewSections: [],
    stats: {
      summaryTokens: 0,
      riskTokens: 0,
      reviewTokens: 0,
      sectionsIncluded: [],
      sectionsDropped: [],
    },
    bundle: null,
  };
}
