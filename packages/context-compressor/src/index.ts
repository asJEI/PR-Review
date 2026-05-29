export { compressReviewContext } from "./compress-review-context.js";
export { runCompressionPipeline } from "./pipeline/run-compression-pipeline.js";
export {
  createDefaultProcessors,
  runProcessors,
} from "./processors/run-processors.js";
export type { CompressionProcessor } from "./processors/compression-processor.js";
export {
  DEFAULT_COMPRESSION_OPTIONS,
  resolveCompressionOptions,
} from "./pipeline/defaults.js";
export type {
  CompressionState,
  ExtractedSignal,
  SignalKind,
} from "./pipeline/types.js";
export type {
  CompressedModuleContext,
  CompressedReviewContext,
  CompressionOptions,
  CompressionStats,
  LogicChangeSummary,
} from "@pr-review/shared";
