import type {
  CompressedReviewContext,
  FileContext,
  FileRelevanceScore,
  HunkContext,
  RelevanceReport,
  SymbolChange,
  SymbolRelevanceScore,
} from "@pr-review/shared";

import { filterEligibleHunks } from "../filters/hunk-noise-filter.js";
import {
  aggregateHighSignalBoost,
  highSignalLabels,
  scoreHighSignalText,
} from "./high-signal-heuristics.js";
import { collectChangeLineNumbers } from "../utils/token-estimate.js";

export interface RankedHunk {
  file: string;
  hunkIndex: number;
  hunk: HunkContext;
  score: number;
  riskSignals: string[];
  matchedSymbols: SymbolChange[];
}

function priorityBase(priority: FileRelevanceScore["priority"]): number {
  switch (priority) {
    case "critical":
      return 0.85;
    case "high":
      return 0.7;
    case "medium":
      return 0.5;
    case "low":
      return 0.35;
    default:
      return 0;
  }
}

function symbolScoreForHunk(
  hunk: HunkContext,
  symbols: SymbolChange[],
  symbolScores: SymbolRelevanceScore[],
): { boost: number; matched: SymbolChange[] } {
  const matched: SymbolChange[] = [];
  let boost = 0;

  const changeText = hunk.changeLines.map((line) => line.content).join("\n");
  const changeNums = collectChangeLineNumbers(hunk.changeLines);

  for (const symbol of symbols) {
    const inText = changeText.includes(symbol.name);
    const inLine =
      symbol.line !== undefined &&
      changeNums.some((num) => Math.abs(num - symbol.line!) <= 3);

    if (inText || inLine) {
      matched.push(symbol);
      const scoreEntry = symbolScores.find(
        (entry) => entry.file === symbol.name || entry.symbol === symbol.name,
      );
      boost = Math.max(boost, scoreEntry?.relevanceScore ?? 0.1);
    }
  }

  return { boost, matched };
}

function moduleRiskHints(compressed: CompressedReviewContext, file: string): string[] {
  const hints = new Set<string>();
  for (const module of compressed.modules) {
    if (file.startsWith(module.module) || file.includes(`/${module.module}/`)) {
      for (const hint of module.riskContext) {
        hints.add(hint);
      }
    }
  }
  return [...hints];
}

export function rankHunksForFile(
  fileContext: FileContext,
  fileScore: FileRelevanceScore | undefined,
  symbolScores: SymbolRelevanceScore[],
  compressed: CompressedReviewContext,
  semanticRiskHints: string[],
): RankedHunk[] {
  if (!fileScore || fileScore.priority === "ignored") {
    return [];
  }

  const eligible = filterEligibleHunks(fileContext.hunks);
  const ranked: RankedHunk[] = [];

  for (let hunkIndex = 0; hunkIndex < fileContext.hunks.length; hunkIndex += 1) {
    const hunk = fileContext.hunks[hunkIndex]!;
    if (!eligible.includes(hunk)) {
      continue;
    }

    let score = fileScore.relevanceScore * 0.6 + priorityBase(fileScore.priority) * 0.4;

    const hunkText = [
      ...hunk.changeLines.map((line) => line.content),
      ...hunk.contextLines.map((line) => line.content),
      fileContext.filename,
    ].join("\n");

    const highSignal = scoreHighSignalText(hunkText);
    score += aggregateHighSignalBoost(highSignal);

    const { boost: symbolBoost, matched } = symbolScoreForHunk(
      hunk,
      fileContext.symbols,
      symbolScores.filter((entry) => entry.file === fileContext.filename),
    );
    score += symbolBoost;

    const riskSignals = new Set<string>(highSignalLabels(highSignal));
    for (const hint of semanticRiskHints) {
      if (hint.includes(fileContext.filename)) {
        riskSignals.add(hint);
        score += 0.05;
      }
    }
    for (const hint of moduleRiskHints(compressed, fileContext.filename)) {
      riskSignals.add(hint);
      score += 0.05;
    }

    ranked.push({
      file: fileContext.filename,
      hunkIndex,
      hunk,
      score: Math.min(1, score),
      riskSignals: [...riskSignals],
      matchedSymbols: matched,
    });
  }

  return ranked.sort((left, right) => right.score - left.score);
}

export function rankAllHunks(
  files: FileContext[],
  relevanceReport: RelevanceReport,
  compressed: CompressedReviewContext,
  reviewRiskHints: string[],
): RankedHunk[] {
  const fileScoreMap = new Map(relevanceReport.files.map((file) => [file.file, file]));
  const all: RankedHunk[] = [];

  for (const file of files) {
    all.push(
      ...rankHunksForFile(
        file,
        fileScoreMap.get(file.filename),
        relevanceReport.symbols,
        compressed,
        reviewRiskHints,
      ),
    );
  }

  return all.sort((left, right) => right.score - left.score);
}
