import type { CompressionRiskCategory } from "@pr-review/shared";
import type { EngineeringModuleContext } from "@pr-review/shared";

import { matchCommitTheme } from "../signals/commit-intent-matcher.js";
import { dominantRiskCategory } from "../signals/risk-signals.js";
import type { ExtractedSignal } from "../pipeline/types.js";

const RISK_TEMPLATES: Record<CompressionRiskCategory, string> = {
  authLogicChanged: "Authentication/authorization logic update",
  databaseOperationModified: "Database write/read path modification",
  cacheLayerTouched: "Cache invalidation or caching layer update",
  asyncIntroduced: "Async migration for I/O or database operations",
  errorHandlingRemoved: "Error handling path changed (removal detected)",
  concurrencyRisk: "Concurrency-sensitive logic changed",
};

export function buildCoreChange(
  module: EngineeringModuleContext,
  signals: ExtractedSignal[],
  commitThemes: string[],
  matchedCommit: string | null,
): string {
  if (matchedCommit) {
    return matchedCommit;
  }

  const matched = matchCommitTheme(commitThemes, module.relatedFiles);

  if (matched) {
    return matched;
  }

  const dominantRisk = dominantRiskCategory(signals);

  if (dominantRisk) {
    return RISK_TEMPLATES[dominantRisk];
  }

  const authSignal = signals.find((signal) => signal.category === "authLogicChanged");

  if (authSignal && module.affectedFunctions.length > 0) {
    const names = module.affectedFunctions
      .slice(0, 3)
      .map((symbol) => symbol.name)
      .join(", ");

    return `Auth module: ${names} flow changes`;
  }

  const keySymbols = module.affectedFunctions
    .slice(0, 3)
    .map((symbol) => symbol.name);

  if (keySymbols.length > 0) {
    return `${module.module}: ${module.relatedFiles.length} file(s) modified; key symbols ${keySymbols.join(", ")}`;
  }

  return `${module.module}: ${module.relatedFiles.length} file(s) modified`;
}
