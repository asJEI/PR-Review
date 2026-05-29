import { filterPreservedRiskHints } from "../filters/risk-signal-filter.js";
import { buildLogicChangesFromSymbols } from "../strategies/logic-change-templates.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export class LogicCompressorProcessor implements CompressionProcessor {
  readonly id = "logic-compressor";

  process(state: CompressionState): CompressionState {
    const logicChangesByModule = new Map(state.logicChangesByModule);

    for (const module of state.activeModules) {
      const signals = state.signalsByModule.get(module.module) ?? [];
      const riskContext = filterPreservedRiskHints(
        module.riskContext,
        state.options.preserveRiskCategories,
      );

      const relatedFiles = module.relatedFiles;
      const fileSymbols = state.activeFiles
        .filter((file) => relatedFiles.includes(file.filename))
        .flatMap((file) => file.symbols);

      const symbols =
        module.affectedFunctions.length > 0
          ? module.affectedFunctions
          : fileSymbols;

      logicChangesByModule.set(
        module.module,
        buildLogicChangesFromSymbols(
          symbols,
          riskContext,
          signals,
          relatedFiles,
        ),
      );
    }

    return { ...state, logicChangesByModule };
  }
}
