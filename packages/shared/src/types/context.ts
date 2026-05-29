import type { FileChangeStatus, ParsedPrUrl } from "./pr.js";

/** Options for building review context from PullRequestData. */
export interface BuildContextOptions {
  /** Rough token budget for compressed output. Default: 12000 */
  maxEstimatedTokens?: number;
  /** Max context lines kept per hunk (each side). Default: 8 */
  maxContextLinesPerHunk?: number;
  /** Max symbols extracted per file. Default: 20 */
  maxSymbolsPerFile?: number;
  /** Include summarized existing PR comments. Default: true */
  includeExistingComments?: boolean;
}

export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "method"
  | "variable"
  | "unknown";

export type SymbolChangeType = "added" | "removed" | "modified";

/** A function/class/method touched by the diff (heuristic extraction). */
export interface SymbolChange {
  name: string;
  kind: SymbolKind;
  changeType: SymbolChangeType;
  /** Parent scope when detectable (e.g. class name). */
  scope?: string;
  /** Line in the new file, if known. */
  line?: number;
}

export type DiffLineType = "add" | "delete" | "context";

/** A single line within a hunk. */
export interface ContextLine {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

/** Compressed hunk for LLM consumption. */
export interface HunkContext {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  /** Trimmed context lines surrounding changes. */
  contextLines: ContextLine[];
  /** Lines with + or - prefix (the actual change). */
  changeLines: ContextLine[];
}

export type ImportKind = "esm" | "cjs" | "dynamic" | "python" | "go" | "unknown";

export type ImportEdgeType = "internal" | "external";

/** Directed import relationship between files or to external module. */
export interface ImportEdge {
  from: string;
  to: string;
  kind: ImportKind;
  edgeType: ImportEdgeType;
}

/** Cluster of related changed files. */
export interface ChangeGroup {
  id: string;
  label: string;
  files: string[];
  rationale: string;
}

export interface ChangeProfile {
  added: number;
  modified: number;
  removed: number;
  renamed: number;
  languages: Record<string, number>;
}

/** Deterministic semantic summary (no LLM). */
export interface SemanticSummary {
  primaryAreas: string[];
  changeProfile: ChangeProfile;
  symbolSummary: string[];
  commitThemes: string[];
  discussionHints: string[];
  riskHints: string[];
}

export interface DiscussionSummary {
  path: string | null;
  author: string;
  excerpt: string;
  type: "issue" | "review";
}

export interface ContextMetadata {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  baseRef: string;
  headRef: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface DependencyGraph {
  nodes: string[];
  edges: ImportEdge[];
}

export interface ContextStats {
  fileCount: number;
  symbolCount: number;
  estimatedTokens: number;
  skippedFiles: string[];
  truncatedFiles: string[];
}

/** Per-file compressed engineering context. */
export interface FileContext {
  filename: string;
  status: FileChangeStatus;
  language: string;
  additions: number;
  deletions: number;
  symbols: SymbolChange[];
  imports: ImportEdge[];
  hunks: HunkContext[];
  /** True when patch was missing or file was dropped due to budget. */
  truncated: boolean;
}

/**
 * Complete normalized context for downstream AI agents.
 * Output of context-builder; input of packages/ai.
 */
export interface ReviewContext {
  source: ParsedPrUrl;
  metadata: ContextMetadata;
  commitThemes: string[];
  existingDiscussion: DiscussionSummary[];
  changeGroups: ChangeGroup[];
  files: FileContext[];
  dependencyGraph: DependencyGraph;
  semanticSummary: SemanticSummary;
  stats: ContextStats;
  builtAt: string;
}
