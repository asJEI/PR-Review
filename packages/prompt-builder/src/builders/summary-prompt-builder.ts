import { formatMetadata } from "../formatters/metadata-formatter.js";
import {
  formatArchitecturalSignals,
  formatModuleContext,
} from "../formatters/module-context-formatter.js";
import { formatSemanticOverview } from "../formatters/semantic-formatter.js";
import type { PromptBuildState } from "../pipeline/types.js";
import {
  SUMMARY_CONSTRAINTS,
  SUMMARY_OUTPUT,
  SUMMARY_ROLE,
  SUMMARY_TASK,
} from "../templates/summary-template.js";
import { SECTION_HEADERS } from "../templates/sections.js";
import { createSection } from "../assembly/section-prioritizer.js";
import type { PromptBuilder } from "./prompt-builder.js";

export class SummaryPromptBuilder implements PromptBuilder {
  readonly id = "summary" as const;

  build(state: PromptBuildState): PromptBuildState {
    const { compressedContext } = state.input;
    const maxModules = state.options.maxModulesPerPrompt;

    state.summarySections = [
      createSection("summary-role", SUMMARY_ROLE, SUMMARY_TASK, "summary", 100),
      createSection(
        "summary-metadata",
        SECTION_HEADERS.metadata,
        formatMetadata(compressedContext.metadata),
        "summary",
        90,
      ),
      createSection(
        "summary-overview",
        SECTION_HEADERS.changeOverview,
        formatSemanticOverview(compressedContext, state.semanticSummary),
        "summary",
        80,
      ),
      createSection(
        "summary-modules",
        SECTION_HEADERS.moduleImpact,
        formatModuleContext(state.mergedModules, maxModules),
        "summary",
        70,
      ),
      createSection(
        "summary-architecture",
        SECTION_HEADERS.architecturalSignals,
        formatArchitecturalSignals(state.mergedModules),
        "summary",
        60,
      ),
      createSection("summary-output", SUMMARY_OUTPUT, "", "summary", 50),
      createSection("summary-constraints", SUMMARY_CONSTRAINTS, "", "summary", 40),
    ];

    return state;
  }
}
