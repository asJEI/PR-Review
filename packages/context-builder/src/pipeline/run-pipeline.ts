import type { BuildContextOptions, PullRequestData, ReviewContext } from "@pr-review/shared";

import { estimateObjectTokens } from "../utils/token-estimate.js";
import { buildDependencyGraphStage } from "./stages/build-dependency-graph.js";
import { buildSummaries } from "./stages/build-summaries.js";
import { compressContext } from "./stages/compress-context.js";
import { extractImports } from "./stages/extract-imports.js";
import { extractSymbols } from "./stages/extract-symbols.js";
import { groupChanges } from "./stages/group-changes.js";
import { initPipelineState } from "./stages/parse-diffs.js";

/**
 * Runs the context-building pipeline in order.
 * Each stage is a pure function over PipelineState.
 */
export function runPipeline(
  input: PullRequestData,
  options?: BuildContextOptions,
): ReviewContext {
  let state = initPipelineState(input, options);
  state = extractSymbols(state);
  state = extractImports(state);
  state = buildDependencyGraphStage(state);
  state = groupChanges(state);
  state = buildSummaries(state);
  state = compressContext(state);

  const symbolCount = [...state.symbolsByFile.values()].reduce(
    (sum, symbols) => sum + symbols.length,
    0,
  );

  const estimatedTokens = estimateObjectTokens({
    files: state.files,
    semanticSummary: state.semanticSummary,
    changeGroups: state.changeGroups,
  });

  return {
    source: input.source,
    metadata: state.metadata,
    commitThemes: state.commitThemes,
    existingDiscussion: state.existingDiscussion,
    changeGroups: state.changeGroups,
    files: state.files,
    dependencyGraph: state.dependencyGraph,
    semanticSummary: state.semanticSummary,
    stats: {
      fileCount: state.files.length,
      symbolCount,
      estimatedTokens,
      skippedFiles: state.skippedFiles,
      truncatedFiles: state.truncatedFiles,
    },
    builtAt: new Date().toISOString(),
  };
}
