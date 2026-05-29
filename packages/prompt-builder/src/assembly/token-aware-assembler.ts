import type { PromptAgentId, PromptSection } from "@pr-review/shared";

import { agentTokenBudget } from "../pipeline/defaults.js";
import type { PromptBuildState } from "../pipeline/types.js";
import { estimateTextTokens } from "../utils/token-estimate.js";
import { prioritizeSections } from "./section-prioritizer.js";

export interface AssembledPrompt {
  prompt: string;
  tokens: number;
  included: string[];
  dropped: string[];
}

function assembleSections(sections: PromptSection[], tokenBudget: number): AssembledPrompt {
  const ordered = prioritizeSections(sections);
  const included: string[] = [];
  const dropped: string[] = [];
  const parts: string[] = [];
  let tokens = 0;

  for (const section of ordered) {
    const sectionText = `${section.title}\n\n${section.content}`.trim();
    const sectionTokens = estimateTextTokens(sectionText);

    if (tokens + sectionTokens > tokenBudget && parts.length > 0) {
      dropped.push(section.id);
      continue;
    }

    if (sectionTokens > tokenBudget && parts.length === 0) {
      const truncated = sectionText.slice(0, tokenBudget * 4);
      parts.push(truncated);
      tokens = estimateTextTokens(truncated);
      included.push(section.id);
      continue;
    }

    parts.push(sectionText);
    tokens += sectionTokens;
    included.push(section.id);
  }

  for (const section of ordered) {
    if (!included.includes(section.id) && !dropped.includes(section.id)) {
      dropped.push(section.id);
    }
  }

  return {
    prompt: parts.join("\n\n").trim(),
    tokens,
    included,
    dropped,
  };
}

export function assemblePromptForAgent(
  state: PromptBuildState,
  agentId: PromptAgentId,
): AssembledPrompt {
  const sections =
    agentId === "summary"
      ? state.summarySections
      : agentId === "risk"
        ? state.riskSections
        : state.reviewSections;

  const budget = agentTokenBudget(state.options, agentId);
  return assembleSections(sections, budget);
}

export function assembleAllPrompts(state: PromptBuildState): PromptBuildState {
  const summary = assemblePromptForAgent(state, "summary");
  const risk = assemblePromptForAgent(state, "risk");
  const review = assemblePromptForAgent(state, "review");

  state.stats = {
    summaryTokens: summary.tokens,
    riskTokens: risk.tokens,
    reviewTokens: review.tokens,
    sectionsIncluded: [...summary.included, ...risk.included, ...review.included],
    sectionsDropped: [...summary.dropped, ...risk.dropped, ...review.dropped],
  };

  state.bundle = {
    summaryPrompt: summary.prompt,
    riskPrompt: risk.prompt,
    reviewPrompt: review.prompt,
    stats: state.stats,
    builtAt: new Date().toISOString(),
  };

  return state;
}
