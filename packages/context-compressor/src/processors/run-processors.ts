import { ArchitecturalImpactProcessor } from "./architectural-impact-processor.js";
import type { CompressionProcessor } from "./compression-processor.js";
import { IntentExtractorProcessor } from "./intent-extractor-processor.js";
import { LogicCompressorProcessor } from "./logic-compressor-processor.js";
import { ModuleAssemblerProcessor } from "./module-assembler-processor.js";
import { NoiseFilterProcessor } from "./noise-filter-processor.js";
import { SignalExtractorProcessor } from "./signal-extractor-processor.js";
import { TokenBudgetProcessor } from "./token-budget-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export function createDefaultProcessors(): CompressionProcessor[] {
  return [
    new NoiseFilterProcessor(),
    new SignalExtractorProcessor(),
    new IntentExtractorProcessor(),
    new LogicCompressorProcessor(),
    new ArchitecturalImpactProcessor(),
    new ModuleAssemblerProcessor(),
    new TokenBudgetProcessor(),
  ];
}

export function runProcessors(
  state: CompressionState,
  processors: CompressionProcessor[] = createDefaultProcessors(),
): CompressionState {
  return processors.reduce((current, processor) => processor.process(current), state);
}
