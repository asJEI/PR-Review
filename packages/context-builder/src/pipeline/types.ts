import type { ParsedFileDiff, SemanticAnalysis } from "@pr-review/diff-parser";
import type {
  BuildContextOptions,
  ChangeGroup,
  ChangedFile,
  ContextMetadata,
  DiscussionSummary,
  FileContext,
  ImportEdge,
  PullRequestData,
  SemanticSummary,
  SymbolChange,
} from "@pr-review/shared";

import type { FileDependencyGraph } from "../graph/file-dependency-graph.js";

export interface ParsedFileEntry {
  changedFile: ChangedFile;
  parsedDiff: ParsedFileDiff;
  semantic: SemanticAnalysis;
  language: string;
}

export interface PipelineState {
  input: PullRequestData;
  options: Required<BuildContextOptions>;
  metadata: ContextMetadata;
  commitThemes: string[];
  existingDiscussion: DiscussionSummary[];
  parsedFiles: ParsedFileEntry[];
  symbolsByFile: Map<string, SymbolChange[]>;
  importsByFile: Map<string, ImportEdge[]>;
  dependencyGraph: FileDependencyGraph;
  changeGroups: ChangeGroup[];
  semanticSummary: SemanticSummary;
  files: FileContext[];
  skippedFiles: string[];
  truncatedFiles: string[];
}
