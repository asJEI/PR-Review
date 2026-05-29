import type { ParsedFileDiff, RiskAnalysisResult, SemanticAnalysis } from "@pr-review/diff-parser";
import type {
  BuildContextOptions,
  CallChainHint,
  ChangeGroup,
  ChangedFile,
  ContextMetadata,
  DiscussionSummary,
  EngineeringModuleContext,
  FileContext,
  HunkContext,
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
  riskByFile: Map<string, RiskAnalysisResult>;
  expandedDepsByFile: Map<string, string[]>;
  callChainHints: CallChainHint[];
  enrichedHunksByFile: Map<string, HunkContext[]>;
  modules: EngineeringModuleContext[];
}
