import type { CompressionRiskCategory } from "@pr-review/shared";

import { inferRiskCategory } from "../filters/risk-signal-filter.js";
import type { ExtractedSignal } from "../pipeline/types.js";

export function extractRiskSignals(riskHints: string[]): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];

  for (const hint of riskHints) {
    const category = inferRiskCategory(hint);

    signals.push({
      kind: "risk",
      label: hint,
      weight: category ? 20 : 8,
      category: category ?? undefined,
    });
  }

  return signals;
}

export function hasProtectedRiskCategory(
  signals: ExtractedSignal[],
  preserveCategories: CompressionRiskCategory[],
): boolean {
  return signals.some(
    (signal) =>
      signal.kind === "risk" &&
      signal.category !== undefined &&
      preserveCategories.includes(signal.category as CompressionRiskCategory),
  );
}

export function dominantRiskCategory(
  signals: ExtractedSignal[],
): CompressionRiskCategory | null {
  const riskSignals = signals.filter((signal) => signal.category);

  if (riskSignals.length === 0) {
    return null;
  }

  riskSignals.sort((a, b) => b.weight - a.weight);

  return (riskSignals[0]?.category as CompressionRiskCategory) ?? null;
}
