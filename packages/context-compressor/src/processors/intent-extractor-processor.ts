import { buildCoreChange } from "../strategies/core-change-templates.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export class IntentExtractorProcessor implements CompressionProcessor {
  readonly id = "intent-extractor";

  process(state: CompressionState): CompressionState {
    const coreChangeByModule = new Map(state.coreChangeByModule);

    for (const module of state.activeModules) {
      const signals = state.signalsByModule.get(module.module) ?? [];
      const matchedCommit =
        state.matchedCommitByModule.get(module.module) ?? null;

      coreChangeByModule.set(
        module.module,
        buildCoreChange(
          module,
          signals,
          state.input.commitThemes,
          matchedCommit,
        ),
      );
    }

    return { ...state, coreChangeByModule };
  }
}
