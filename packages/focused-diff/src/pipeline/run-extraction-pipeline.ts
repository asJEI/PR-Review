import type {
  FocusedDiffInput,
  FocusedDiffOptions,
  FocusedDiffReport,
} from "@pr-review/shared";

import { applyFocusedDiffBudget, contextLinesForCompressionLevel } from "../budget/focused-diff-budget.js";
import { compressAllSnippets } from "../compression/diff-compression.js";
import { filterEligibleFiles } from "../filters/hunk-noise-filter.js";
import { mapAllSymbols } from "../mapping/symbol-context-mapper.js";
import { rankAllHunks } from "../ranking/hunk-ranking-engine.js";
import { resolveOptions } from "./defaults.js";
import { initExtractionState } from "./init-extraction-state.js";

export function runExtractionPipeline(
  input: FocusedDiffInput,
  options?: FocusedDiffOptions,
): FocusedDiffReport {
  const resolved = resolveOptions(input.relevanceReport.budget.totalBudget, options);
  const state = initExtractionState(
    input.reviewContext,
    input.compressedContext,
    input.relevanceReport,
    resolved,
  );

  const eligibleFiles = filterEligibleFiles(input.reviewContext.files);
  state.filesConsidered = eligibleFiles.length;

  const riskHints = input.compressedContext.modules.flatMap((module) => module.riskContext);
  const rankedHunks = rankAllHunks(
    eligibleFiles,
    input.relevanceReport,
    input.compressedContext,
    riskHints,
  );
  state.hunksConsidered = rankedHunks.length;

  const compressionByFile = new Map(
    input.relevanceReport.files.map((file) => [
      file.file,
      file.compressionLevel,
    ]),
  );

  const maxContextLines =
    resolved.maxContextLinesPerSnippet ??
    contextLinesForCompressionLevel("normal");

  const mapped = mapAllSymbols(eligibleFiles, rankedHunks, maxContextLines);
  const compressed = compressAllSnippets(mapped, compressionByFile);

  const { retained, filtered } = applyFocusedDiffBudget(
    compressed,
    input.relevanceReport,
    {
      totalTokenBudget: resolved.totalTokenBudget,
      maxItems: resolved.maxItems,
      minRelevanceScore: resolved.minRelevanceScore,
    },
  );

  const totalEstimatedTokens = retained.reduce(
    (sum, item) => sum + item.estimatedTokens,
    0,
  );

  return {
    items: retained,
    generatedAt: new Date().toISOString(),
    stats: {
      filesConsidered: state.filesConsidered,
      hunksConsidered: state.hunksConsidered,
      itemsRetained: retained.length,
      itemsFiltered: filtered,
      totalEstimatedTokens,
    },
  };
}
