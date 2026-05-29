import type { CompressionLevel, FocusedDiffItem, RelevanceReport } from "@pr-review/shared";

import type { CompressedSnippet } from "../compression/diff-compression.js";

export function contextLinesForCompressionLevel(level: CompressionLevel): number {
  switch (level) {
    case "preserve":
      return 8;
    case "aggressive":
      return 3;
    default:
      return 6;
  }
}

function dedupeKey(item: FocusedDiffItem): string {
  const range = item.lineRange
    ? `${item.lineRange.start}-${item.lineRange.end}`
    : String(item.hunkIndex ?? "na");
  return `${item.file}::${item.symbol ?? ""}::${range}`;
}

export function applyFocusedDiffBudget(
  items: CompressedSnippet[],
  relevanceReport: RelevanceReport,
  options: {
    totalTokenBudget: number;
    maxItems: number;
    minRelevanceScore: number;
  },
): { retained: FocusedDiffItem[]; filtered: number } {
  const fileCaps = new Map(
    relevanceReport.budget.fileAllocations.map((entry) => [entry.file, entry.tokens]),
  );
  const fileUsed = new Map<string, number>();
  const globalCap = options.totalTokenBudget;

  const eligible = items
    .filter((item) => item.relevance >= options.minRelevanceScore)
    .sort((left, right) => right.relevance - left.relevance);

  const retained: FocusedDiffItem[] = [];
  const seen = new Set<string>();
  let totalTokens = 0;

  for (const item of eligible) {
    if (retained.length >= options.maxItems) {
      continue;
    }

    const key = dedupeKey(item as FocusedDiffItem);
    if (seen.has(key)) {
      continue;
    }

    const fileCap = fileCaps.get(item.file) ?? Math.ceil(globalCap / 4);
    const usedInFile = fileUsed.get(item.file) ?? 0;

    if (usedInFile + item.estimatedTokens > fileCap) {
      continue;
    }
    if (totalTokens + item.estimatedTokens > globalCap) {
      continue;
    }

    seen.add(key);
    fileUsed.set(item.file, usedInFile + item.estimatedTokens);
    totalTokens += item.estimatedTokens;
    retained.push(item);
  }

  const filtered = items.length - retained.length;

  return { retained, filtered };
}