import { buildArchitecturalImpact } from "../strategies/architectural-rules.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export class ArchitecturalImpactProcessor implements CompressionProcessor {
  readonly id = "architectural-impact";

  process(state: CompressionState): CompressionState {
    const architecturalImpactByModule = new Map(
      state.architecturalImpactByModule,
    );

    for (const module of state.activeModules) {
      architecturalImpactByModule.set(
        module.module,
        buildArchitecturalImpact(module, state.activeModules),
      );
    }

    return { ...state, architecturalImpactByModule };
  }
}
