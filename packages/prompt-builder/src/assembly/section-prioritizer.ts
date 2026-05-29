import type { PromptSection } from "@pr-review/shared";

import { priorityRank } from "../pipeline/defaults.js";

const RISK_KEYWORDS =
  /auth|login|token|jwt|session|database|cache|async|concurr|error handling|middleware/i;

export function prioritizeSections(sections: PromptSection[]): PromptSection[] {
  return [...sections].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return left.id.localeCompare(right.id);
  });
}

export function sectionPriorityFromRelevanceScore(score: number): number {
  return Math.round(score * 100);
}

export function sectionPriorityFromLabel(priority: string): number {
  return priorityRank(priority) * 20;
}

export function boostIfRiskContent(content: string, basePriority: number): number {
  return RISK_KEYWORDS.test(content) ? basePriority + 15 : basePriority;
}

export function createSection(
  id: string,
  title: string,
  content: string,
  agentId: PromptSection["agentId"],
  priority: number,
): PromptSection {
  const estimatedTokens = Math.ceil(content.length / 4);
  return { id, title, content, priority, estimatedTokens, agentId };
}
