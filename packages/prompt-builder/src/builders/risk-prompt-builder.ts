import { formatMetadata } from "../formatters/metadata-formatter.js";
import {
  formatLogicChangeRisks,
  formatModuleRiskContext,
  formatRiskSignals,
} from "../formatters/risk-formatter.js";
import {
  formatRankedFiles,
  formatRankedSymbols,
} from "../formatters/relevance-formatter.js";
import type { PromptBuildState } from "../pipeline/types.js";
import {
  RISK_CONSTRAINTS,
  RISK_OUTPUT,
  RISK_ROLE,
  RISK_TASK,
} from "../templates/risk-template.js";
import { SECTION_HEADERS } from "../templates/sections.js";
import { createSection } from "../assembly/section-prioritizer.js";
import type { PromptBuilder } from "./prompt-builder.js";

export class RiskPromptBuilder implements PromptBuilder {
  readonly id = "risk" as const;

  build(state: PromptBuildState): PromptBuildState {
    const { compressedContext, relevanceReport } = state.input;
    const maxModules = state.options.maxModulesPerPrompt;

    state.riskSections = [
      createSection("risk-role", RISK_ROLE, RISK_TASK, "risk", 100),
      createSection(
        "risk-metadata",
        SECTION_HEADERS.metadata,
        formatMetadata(compressedContext.metadata),
        "risk",
        85,
      ),
      createSection(
        "risk-signals",
        SECTION_HEADERS.riskSignals,
        formatRiskSignals(state.riskSignals),
        "risk",
        95,
      ),
      createSection(
        "risk-modules",
        SECTION_HEADERS.moduleRisk,
        formatModuleRiskContext(state.mergedModules, maxModules),
        "risk",
        80,
      ),
      createSection(
        "risk-logic",
        SECTION_HEADERS.logicRisks,
        formatLogicChangeRisks(state.mergedModules, maxModules),
        "risk",
        75,
      ),
      createSection(
        "risk-files",
        SECTION_HEADERS.priorityFiles,
        formatRankedFiles(
          state.rankedFileOrder,
          state.fileScores,
          state.options,
          relevanceReport.budget,
        ),
        "risk",
        70,
      ),
      createSection(
        "risk-symbols",
        SECTION_HEADERS.prioritySymbols,
        formatRankedSymbols(
          state.rankedSymbolOrder,
          state.symbolScores,
          state.options,
        ),
        "risk",
        65,
      ),
      createSection("risk-output", RISK_OUTPUT, "", "risk", 50),
      createSection("risk-constraints", RISK_CONSTRAINTS, "", "risk", 40),
    ];

    return state;
  }
}
