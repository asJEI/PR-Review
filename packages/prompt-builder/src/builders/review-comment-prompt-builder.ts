import { formatExistingDiscussion } from "../formatters/discussion-formatter.js";
import {
  formatFileBudgetHints,
  formatRankedFiles,
  formatRankedSymbols,
} from "../formatters/relevance-formatter.js";
import type { PromptBuildState } from "../pipeline/types.js";
import {
  REVIEW_CONSTRAINTS,
  REVIEW_OUTPUT,
  REVIEW_ROLE,
  REVIEW_TASK,
} from "../templates/review-comment-template.js";
import { SECTION_HEADERS } from "../templates/sections.js";
import { createSection } from "../assembly/section-prioritizer.js";
import type { PromptBuilder } from "./prompt-builder.js";

const REVIEW_TARGET_PATTERNS =
  /middleware|handler|auth|login|token|export|write|insert|update|delete|repository|service/i;

function formatReviewTargets(state: PromptBuildState): string {
  const lines: string[] = ["High-signal review targets:"];

  for (const symbol of state.symbolScores) {
    if (symbol.priority !== "critical" && symbol.priority !== "high") {
      continue;
    }

    const target = `${symbol.file}::${symbol.symbol}`;
    const isReviewTarget =
      REVIEW_TARGET_PATTERNS.test(symbol.symbol) ||
      REVIEW_TARGET_PATTERNS.test(symbol.file) ||
      symbol.reasons.some((reason) => REVIEW_TARGET_PATTERNS.test(reason));

    if (isReviewTarget) {
      lines.push(
        `- [${symbol.priority}] ${target} (${symbol.kind}, ${symbol.changeType}) — ${symbol.reasons.slice(0, 2).join("; ")}`,
      );
    }
  }

  for (const entry of state.mergedModules) {
    for (const fn of entry.compressed.affectedFunctions) {
      const label = `${entry.module}::${fn.name}`;
      if (fn.changeType === "modified" || fn.changeType === "added") {
        lines.push(`- [module] ${label} (${fn.kind}, ${fn.changeType})`);
      }
    }
  }

  if (lines.length === 1) {
    return "No explicit high-signal targets; use priority file/symbol order below.";
  }

  return lines.join("\n");
}

export class ReviewCommentPromptBuilder implements PromptBuilder {
  readonly id = "review" as const;

  build(state: PromptBuildState): PromptBuildState {
    const { relevanceReport } = state.input;

    state.reviewSections = [
      createSection("review-role", REVIEW_ROLE, REVIEW_TASK, "review", 100),
      createSection(
        "review-targets",
        SECTION_HEADERS.reviewTargets,
        formatReviewTargets(state),
        "review",
        95,
      ),
      createSection(
        "review-files",
        SECTION_HEADERS.priorityFiles,
        formatRankedFiles(
          state.rankedFileOrder,
          state.fileScores,
          state.options,
          relevanceReport.budget,
        ),
        "review",
        90,
      ),
      createSection(
        "review-symbols",
        SECTION_HEADERS.prioritySymbols,
        formatRankedSymbols(
          state.rankedSymbolOrder,
          state.symbolScores,
          state.options,
        ),
        "review",
        85,
      ),
      createSection(
        "review-budget",
        SECTION_HEADERS.contextBudget,
        formatFileBudgetHints(relevanceReport.budget),
        "review",
        60,
      ),
      createSection(
        "review-discussion",
        SECTION_HEADERS.existingDiscussion,
        formatExistingDiscussion(state.existingDiscussion),
        "review",
        55,
      ),
      createSection("review-output", REVIEW_OUTPUT, "", "review", 50),
      createSection("review-constraints", REVIEW_CONSTRAINTS, "", "review", 40),
    ];

    return state;
  }
}
