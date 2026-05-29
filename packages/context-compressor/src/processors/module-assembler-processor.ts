import type { CompressedModuleContext } from "@pr-review/shared";

import { filterPreservedRiskHints } from "../filters/risk-signal-filter.js";
import { computePriorityScore } from "../utils/scoring.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export class ModuleAssemblerProcessor implements CompressionProcessor {
  readonly id = "module-assembler";

  process(state: CompressionState): CompressionState {
    const compressedModules: CompressedModuleContext[] = state.activeModules.map(
      (module) => {
        const riskContext = filterPreservedRiskHints(
          module.riskContext,
          state.options.preserveRiskCategories,
        );

        const compressed: CompressedModuleContext = {
          module: module.module,
          coreChange:
            state.coreChangeByModule.get(module.module) ?? module.semanticSummary,
          affectedFunctions: module.affectedFunctions,
          logicChanges: state.logicChangesByModule.get(module.module) ?? [],
          dependencies: module.dependencies,
          expandedDependencies: module.expandedDependencies,
          architecturalImpact:
            state.architecturalImpactByModule.get(module.module) ?? [],
          riskContext,
          priorityScore: 0,
        };

        compressed.priorityScore = computePriorityScore(compressed);

        return compressed;
      },
    );

    compressedModules.sort((a, b) => b.priorityScore - a.priorityScore);

    return { ...state, compressedModules };
  }
}
