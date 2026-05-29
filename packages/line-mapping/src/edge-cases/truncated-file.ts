import type { FileLineIndex } from "../types.js";

export function isTruncatedFile(index: FileLineIndex | undefined): boolean {
  return index?.truncated === true;
}

export function hasUsablePatch(
  patch: string | null | undefined,
  truncated: boolean,
): boolean {
  if (truncated) {
    return false;
  }
  return typeof patch === "string" && patch.trim().length > 0;
}

export function downgradeConfidenceForTruncated<
  T extends { confidence: "exact" | "approximate" | "inferred"; truncated?: boolean },
>(mapping: T, truncated: boolean): T {
  if (!truncated) {
    return mapping;
  }
  return {
    ...mapping,
    truncated: true,
    confidence: mapping.confidence === "exact" ? "approximate" : "inferred",
  };
}
