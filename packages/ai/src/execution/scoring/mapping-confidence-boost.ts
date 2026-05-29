import type { LineMappingConfidence } from "@pr-review/shared";

export function mappingConfidenceBoost(confidence: LineMappingConfidence | undefined): number {
  switch (confidence) {
    case "exact":
      return 0.12;
    case "approximate":
      return 0.05;
    default:
      return 0;
  }
}

export function mappingConfidencePenalty(
  confidence: LineMappingConfidence | undefined,
  hasLine: boolean,
  truncated?: boolean,
): number {
  let penalty = 0;
  if (confidence === "inferred" && hasLine) {
    penalty += 0.25;
  }
  if (truncated) {
    penalty += 0.08;
  }
  return penalty;
}
