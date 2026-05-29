import { analyzeSemantics, parseUnifiedDiff } from "@pr-review/diff-parser";
import type { ContextMetadata, PullRequestData } from "@pr-review/shared";

import { detectLanguage } from "../../parsers/detect-language.js";
import { extractCommitThemes } from "../../utils/commit-themes.js";
import { summarizeComments } from "../../utils/comment-summarizer.js";
import type { ParsedFileEntry, PipelineState } from "../types.js";
import { resolveBuildOptions } from "../defaults.js";

function buildMetadata(input: PullRequestData): ContextMetadata {
  const { metadata } = input;

  return {
    number: metadata.number,
    title: metadata.title,
    state: metadata.state,
    author: metadata.author.login,
    baseRef: metadata.base.ref,
    headRef: metadata.head.ref,
    additions: metadata.additions,
    deletions: metadata.deletions,
    changedFiles: metadata.changedFiles,
  };
}

export function initPipelineState(
  input: PullRequestData,
  options?: import("@pr-review/shared").BuildContextOptions,
): PipelineState {
  const resolved = resolveBuildOptions(options);

  const parsedFiles: ParsedFileEntry[] = input.changedFiles.map(
    (changedFile) => {
      const language = detectLanguage(changedFile.filename);
      const parsedDiff = parseUnifiedDiff(
        changedFile.filename,
        changedFile.patch,
      );

      return {
        changedFile,
        parsedDiff,
        semantic: analyzeSemantics(parsedDiff, { language }),
        language,
      };
    },
  );

  const skippedFiles = parsedFiles
    .filter((entry) => entry.parsedDiff.isEmpty && entry.changedFile.patch === null)
    .map((entry) => entry.changedFile.filename);

  return {
    input,
    options: resolved,
    metadata: buildMetadata(input),
    commitThemes: extractCommitThemes(input.commits),
    existingDiscussion: resolved.includeExistingComments
      ? summarizeComments(input.comments)
      : [],
    parsedFiles,
    symbolsByFile: new Map(),
    importsByFile: new Map(),
    dependencyGraph: { nodes: [], edges: [] },
    changeGroups: [],
    semanticSummary: {
      primaryAreas: [],
      changeProfile: {
        added: 0,
        modified: 0,
        removed: 0,
        renamed: 0,
        languages: {},
      },
      symbolSummary: [],
      commitThemes: [],
      discussionHints: [],
      riskHints: [],
    },
    files: [],
    skippedFiles,
    truncatedFiles: [],
    riskByFile: new Map(),
    expandedDepsByFile: new Map(),
    callChainHints: [],
    enrichedHunksByFile: new Map(),
    modules: [],
  };
}
