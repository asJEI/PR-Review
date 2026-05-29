import type { ReviewContext } from "./context.js";

export type LineMappingConfidence = "exact" | "approximate" | "inferred";

export type DiffSide = "LEFT" | "RIGHT";

export interface LineMappingRange {
  startLine: number;
  endLine: number;
  side: DiffSide;
}

export interface SymbolDiffMapping {
  file: string;
  symbol: string | null;
  hunkIndex: number;
  startLine: number;
  endLine: number;
  changedLines: number[];
  oldStartLine?: number;
  oldEndLine?: number;
  side: DiffSide;
  githubPosition?: number;
  confidence: LineMappingConfidence;
  truncated?: boolean;
}

export interface LineMappingInput {
  reviewContext: ReviewContext;
  /** Raw unified diff per file (from PullRequestData.changedFiles[].patch) for position math */
  patchesByFile?: Record<string, string | null>;
  /** previousFilename → filename for renamed paths */
  pathAliases?: Record<string, string>;
}

export interface LineMappingOptions {
  preferChangeLines?: boolean;
  symbolProximity?: number;
}
