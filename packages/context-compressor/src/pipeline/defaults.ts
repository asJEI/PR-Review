import type { CompressionOptions, CompressionRiskCategory } from "@pr-review/shared";

export const DEFAULT_PRESERVE_RISK_CATEGORIES: CompressionRiskCategory[] = [
  "authLogicChanged",
  "databaseOperationModified",
  "errorHandlingRemoved",
  "asyncIntroduced",
  "cacheLayerTouched",
  "concurrencyRisk",
];

export const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxEstimatedTokens: 6000,
  maxModules: Number.MAX_SAFE_INTEGER,
  dropNoiseFiles: true,
  preserveRiskCategories: DEFAULT_PRESERVE_RISK_CATEGORIES,
};

export function resolveCompressionOptions(
  options?: CompressionOptions,
): Required<CompressionOptions> {
  return {
    maxEstimatedTokens:
      options?.maxEstimatedTokens ?? DEFAULT_COMPRESSION_OPTIONS.maxEstimatedTokens,
    maxModules: options?.maxModules ?? DEFAULT_COMPRESSION_OPTIONS.maxModules,
    dropNoiseFiles:
      options?.dropNoiseFiles ?? DEFAULT_COMPRESSION_OPTIONS.dropNoiseFiles,
    preserveRiskCategories:
      options?.preserveRiskCategories ??
      DEFAULT_COMPRESSION_OPTIONS.preserveRiskCategories,
  };
}
