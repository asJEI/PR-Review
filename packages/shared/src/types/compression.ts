import type {
  ContextMetadata,
  ImportEdge,
  SymbolChange,
  SymbolChangeType,
  SymbolKind,
} from "./context.js";
import type { ParsedPrUrl } from "./pr.js";

export type CompressionRiskCategory =
  | "authLogicChanged"
  | "databaseOperationModified"
  | "cacheLayerTouched"
  | "asyncIntroduced"
  | "errorHandlingRemoved"
  | "concurrencyRisk";

/** Structured description of a logic change (no raw code). */
export interface LogicChangeSummary {
  symbol: string;
  kind: SymbolKind;
  changeType: SymbolChangeType;
  whatChanged: string;
  whyItMatters: string;
  riskSignals: string[];
}

/** Module-level compressed context for LLM agents. */
export interface CompressedModuleContext {
  module: string;
  coreChange: string;
  affectedFunctions: SymbolChange[];
  logicChanges: LogicChangeSummary[];
  dependencies: ImportEdge[];
  expandedDependencies: string[];
  architecturalImpact: string[];
  riskContext: string[];
  priorityScore: number;
}

export interface CompressionStats {
  inputTokens: number;
  outputTokens: number;
  modulesIn: number;
  modulesOut: number;
  droppedFiles: string[];
  droppedReasons: Record<string, string>;
  preservedSignalCount: number;
}

/** Output of context-compressor; input for packages/ai. */
export interface CompressedReviewContext {
  source: ParsedPrUrl;
  metadata: ContextMetadata;
  modules: CompressedModuleContext[];
  topLevelSignals: string[];
  commitThemes: string[];
  stats: CompressionStats;
  compressedAt: string;
}

export interface CompressionOptions {
  maxEstimatedTokens?: number;
  maxModules?: number;
  dropNoiseFiles?: boolean;
  preserveRiskCategories?: CompressionRiskCategory[];
}
