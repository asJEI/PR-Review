import type { RelevancePriority } from "@pr-review/shared";

import type { RiskBoost } from "../heuristics/risk-boost-heuristics.js";
import { hasAuthAndDbRisk } from "../heuristics/risk-boost-heuristics.js";

export function classifyPriority(
  score: number,
  ignored: boolean,
  riskBoosts: RiskBoost[] = [],
): RelevancePriority {
  if (ignored || score <= 0) {
    return "ignored";
  }

  if (score >= 0.85 || hasAuthAndDbRisk(riskBoosts)) {
    return "critical";
  }

  if (score >= 0.65) {
    return "high";
  }

  if (score >= 0.4) {
    return "medium";
  }

  return "low";
}

export function compressionLevelForPriority(
  priority: RelevancePriority,
): "preserve" | "normal" | "aggressive" {
  if (priority === "critical" || priority === "high") {
    return "preserve";
  }

  if (priority === "medium") {
    return "normal";
  }

  return "aggressive";
}
