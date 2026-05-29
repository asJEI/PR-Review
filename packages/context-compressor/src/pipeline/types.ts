import type {
  CompressedModuleContext,
  CompressedReviewContext,
  CompressionOptions,
  LogicChangeSummary,
  ReviewContext,
} from "@pr-review/shared";
import type {
  EngineeringModuleContext,
  FileContext,
} from "@pr-review/shared";

export type SignalKind =
  | "risk"
  | "semantic"
  | "path"
  | "commit"
  | "architectural";

export interface ExtractedSignal {
  kind: SignalKind;
  label: string;
  weight: number;
  category?: string;
}

export interface CompressionState {
  input: ReviewContext;
  options: Required<CompressionOptions>;
  activeModules: EngineeringModuleContext[];
  activeFiles: FileContext[];
  droppedFiles: Map<string, string>;
  signalsByModule: Map<string, ExtractedSignal[]>;
  matchedCommitByModule: Map<string, string>;
  coreChangeByModule: Map<string, string>;
  logicChangesByModule: Map<string, LogicChangeSummary[]>;
  architecturalImpactByModule: Map<string, string[]>;
  compressedModules: CompressedModuleContext[];
  topLevelSignals: string[];
  output: CompressedReviewContext | null;
}
