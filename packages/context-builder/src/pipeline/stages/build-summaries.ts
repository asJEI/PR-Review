import type { ChangeProfile, SemanticSummary } from "@pr-review/shared";

import type { PipelineState } from "../types.js";

const CONCURRENCY_HINTS = [
  "mutex",
  "lock",
  "atomic",
  "concurrent",
  "parallel",
  "async",
  "thread",
  "race",
  "semaphore",
];

function directoryArea(filename: string): string {
  const parts = filename.split("/");

  if (parts.length <= 1) {
    return "/";
  }

  return `${parts[0]}/`;
}

function buildChangeProfile(state: PipelineState): ChangeProfile {
  const profile: ChangeProfile = {
    added: 0,
    modified: 0,
    removed: 0,
    renamed: 0,
    languages: {},
  };

  for (const entry of state.parsedFiles) {
    const status = entry.changedFile.status;

    if (status === "added") {
      profile.added += 1;
    } else if (status === "removed") {
      profile.removed += 1;
    } else if (status === "renamed") {
      profile.renamed += 1;
    } else {
      profile.modified += 1;
    }

    const lang = entry.language;
    profile.languages[lang] = (profile.languages[lang] ?? 0) + 1;
  }

  return profile;
}

function buildPrimaryAreas(files: string[]): string[] {
  const counts = new Map<string, number>();

  for (const file of files) {
    const area = directoryArea(file);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => `${area} (${count} files)`);
}

function buildSymbolSummary(state: PipelineState): string[] {
  const names: string[] = [];

  for (const symbols of state.symbolsByFile.values()) {
    for (const symbol of symbols) {
      names.push(`${symbol.kind} ${symbol.name} (${symbol.changeType})`);
    }
  }

  return names.slice(0, 15);
}

function buildDiscussionHints(state: PipelineState): string[] {
  const paths = new Set<string>();

  for (const discussion of state.existingDiscussion) {
    if (discussion.path) {
      paths.add(`${discussion.path} — ${discussion.author}`);
    }
  }

  return [...paths];
}

function buildRiskHints(state: PipelineState): string[] {
  const hints: string[] = [];
  const { metadata } = state;

  if (metadata.deletions > metadata.additions * 2 && metadata.deletions > 50) {
    hints.push("Heavy deletion volume relative to additions");
  }

  for (const entry of state.parsedFiles) {
    const lower = entry.changedFile.filename.toLowerCase();

    if (CONCURRENCY_HINTS.some((hint) => lower.includes(hint))) {
      hints.push(`Concurrency-related path: ${entry.changedFile.filename}`);
    }

    const largeHunk = entry.parsedDiff.hunks.some(
      (h) => h.lines.length > 80,
    );

    if (largeHunk) {
      hints.push(`Large hunk in ${entry.changedFile.filename}`);
    }

    if (entry.semantic.asyncChanges) {
      hints.push(
        `Async/sync signature change detected in ${entry.changedFile.filename}`,
      );
    }
  }

  if (state.skippedFiles.length > 0) {
    hints.push(
      `${state.skippedFiles.length} file(s) without parseable patch`,
    );
  }

  return [...new Set(hints)];
}

export function buildSummaries(state: PipelineState): PipelineState {
  const files = state.parsedFiles.map((e) => e.changedFile.filename);
  const changeProfile = buildChangeProfile(state);

  const semanticSummary: SemanticSummary = {
    primaryAreas: buildPrimaryAreas(files),
    changeProfile,
    symbolSummary: buildSymbolSummary(state),
    commitThemes: state.commitThemes,
    discussionHints: buildDiscussionHints(state),
    riskHints: buildRiskHints(state),
  };

  return { ...state, semanticSummary };
}
