import type { CompressedModuleContext, CompressedReviewContext } from "@pr-review/shared";

import { estimateObjectTokens } from "../utils/token-estimate.js";
import { moduleHasProtectedSignals } from "../utils/scoring.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

function trimModule(module: CompressedModuleContext): CompressedModuleContext {
  return {
    ...module,
    logicChanges: module.logicChanges.slice(0, 5),
    architecturalImpact: module.architecturalImpact.slice(0, 3),
    riskContext: module.riskContext.slice(0, 4),
    expandedDependencies: module.expandedDependencies.slice(0, 6),
  };
}

function buildOutput(
  state: CompressionState,
  modules: CompressedModuleContext[],
): CompressedReviewContext {
  const droppedReasons = Object.fromEntries(state.droppedFiles.entries());

  return {
    source: state.input.source,
    metadata: state.input.metadata,
    modules,
    topLevelSignals: state.topLevelSignals,
    commitThemes: state.input.commitThemes,
    stats: {
      inputTokens: estimateObjectTokens(state.input),
      outputTokens: estimateObjectTokens({
        modules,
        topLevelSignals: state.topLevelSignals,
      }),
      modulesIn: state.input.modules.length,
      modulesOut: modules.length,
      droppedFiles: [...state.droppedFiles.keys()],
      droppedReasons,
      preservedSignalCount: state.topLevelSignals.length,
    },
    compressedAt: new Date().toISOString(),
  };
}

export class TokenBudgetProcessor implements CompressionProcessor {
  readonly id = "token-budget";

  process(state: CompressionState): CompressionState {
    let modules = [...state.compressedModules];

    if (state.options.maxModules < modules.length) {
      modules = modules.slice(0, state.options.maxModules);
    }

    let output = buildOutput(state, modules);
    let estimated = output.stats.outputTokens;
    const maxTokens = state.options.maxEstimatedTokens;

    if (estimated <= maxTokens) {
      return { ...state, compressedModules: modules, output };
    }

    for (let pass = 0; pass < 6 && estimated > maxTokens; pass += 1) {
      modules = modules.map(trimModule);
      output = buildOutput(state, modules);
      estimated = output.stats.outputTokens;

      if (estimated <= maxTokens) {
        break;
      }

      const protectedModules = modules.filter(moduleHasProtectedSignals);
      const droppable = modules
        .filter((module) => !moduleHasProtectedSignals(module))
        .sort((a, b) => a.priorityScore - b.priorityScore);

      if (droppable.length > 0 && modules.length > protectedModules.length) {
        modules = [...protectedModules, ...droppable.slice(1)];
        modules.sort((a, b) => b.priorityScore - a.priorityScore);
        output = buildOutput(state, modules);
        estimated = output.stats.outputTokens;
        continue;
      }

      if (protectedModules.length > 0 && estimated > maxTokens) {
        modules = protectedModules.map((module) => ({
          ...trimModule(module),
          coreChange: module.coreChange.slice(0, 80),
          logicChanges: module.logicChanges.slice(0, 2),
          architecturalImpact: module.architecturalImpact.slice(0, 1),
        }));
        output = buildOutput(state, modules);
        estimated = output.stats.outputTokens;
      }
    }

    return { ...state, compressedModules: modules, output };
  }
}

export { buildOutput };
