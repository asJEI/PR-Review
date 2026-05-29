import type { FileContext } from "@pr-review/shared";

import { estimateObjectTokens } from "../../utils/token-estimate.js";
import { buildHunksForFile } from "./build-hunks.js";
import type { PipelineState } from "../types.js";

function buildFileContexts(state: PipelineState): FileContext[] {
  return state.parsedFiles.map((entry) => {
    const filename = entry.changedFile.filename;
    const hasPatch =
      entry.changedFile.patch !== null && !entry.parsedDiff.isEmpty;

    return {
      filename,
      status: entry.changedFile.status,
      language: entry.language,
      additions: entry.changedFile.additions,
      deletions: entry.changedFile.deletions,
      symbols: state.symbolsByFile.get(filename) ?? [],
      imports: state.importsByFile.get(filename) ?? [],
      hunks: hasPatch
        ? (state.enrichedHunksByFile.get(filename) ??
          buildHunksForFile(entry, state.options.maxContextLinesPerHunk))
        : [],
      truncated: !hasPatch,
    };
  });
}

function dropLowPriorityFiles(
  files: FileContext[],
  keepCount: number,
): { files: FileContext[]; dropped: string[] } {
  const scored = files.map((file) => ({
    file,
    score:
      file.symbols.length * 10 +
      file.hunks.length * 5 +
      file.additions +
      file.deletions,
  }));

  scored.sort((a, b) => b.score - a.score);

  const kept = scored.slice(0, keepCount).map((s) => s.file);
  const dropped = scored.slice(keepCount).map((s) => s.file.filename);

  const stubs = dropped.map((filename) => {
    const original = files.find((f) => f.filename === filename);
    return {
      filename,
      status: original?.status ?? ("modified" as const),
      language: original?.language ?? "unknown",
      additions: original?.additions ?? 0,
      deletions: original?.deletions ?? 0,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: true,
    };
  });

  return { files: [...kept, ...stubs], dropped };
}

function estimatePayloadTokens(
  files: FileContext[],
  semanticSummary: PipelineState["semanticSummary"],
  changeGroups: PipelineState["changeGroups"],
): number {
  return estimateObjectTokens({
    files,
    semanticSummary,
    changeGroups,
  });
}

export function compressContext(state: PipelineState): PipelineState {
  let files = buildFileContexts(state);
  const truncatedFiles = new Set<string>(state.skippedFiles);
  const maxTokens = state.options.maxEstimatedTokens;
  let contextLineBudget = state.options.maxContextLinesPerHunk;

  let semanticSummary = state.semanticSummary;
  let changeGroups = state.changeGroups;

  let estimated = estimatePayloadTokens(files, semanticSummary, changeGroups);

  if (estimated <= maxTokens) {
    return {
      ...state,
      files,
      semanticSummary,
      changeGroups,
      truncatedFiles: [...truncatedFiles],
    };
  }

  for (let pass = 0; pass < 5 && estimated > maxTokens; pass += 1) {
    contextLineBudget = Math.max(1, Math.floor(contextLineBudget / 2));

    files = files.map((file) => ({
      ...file,
      hunks: file.hunks.map((hunk) => ({
        ...hunk,
        contextLines: hunk.contextLines.slice(0, contextLineBudget),
      })),
      truncated: true,
    }));

    for (const file of files) {
      truncatedFiles.add(file.filename);
    }

    estimated = estimatePayloadTokens(files, semanticSummary, changeGroups);

    if (estimated <= maxTokens) {
      break;
    }

    if (files.length > 1) {
      const keepCount = Math.max(1, Math.floor(files.length * 0.5));
      const result = dropLowPriorityFiles(files, keepCount);
      files = result.files;

      for (const name of result.dropped) {
        truncatedFiles.add(name);
      }

      estimated = estimatePayloadTokens(files, semanticSummary, changeGroups);
    }

    if (estimated > maxTokens) {
      semanticSummary = {
        ...semanticSummary,
        primaryAreas: semanticSummary.primaryAreas.slice(0, 2),
        symbolSummary: semanticSummary.symbolSummary.slice(0, 5),
        riskHints: semanticSummary.riskHints.slice(0, 2),
        discussionHints: semanticSummary.discussionHints.slice(0, 2),
      };
      changeGroups = changeGroups.slice(0, 3);
      estimated = estimatePayloadTokens(files, semanticSummary, changeGroups);
    }
  }

  return {
    ...state,
    files,
    semanticSummary,
    changeGroups,
    truncatedFiles: [...truncatedFiles],
  };
}
