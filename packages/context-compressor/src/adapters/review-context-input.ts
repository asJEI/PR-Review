import type { CompressionOptions, ReviewContext } from "@pr-review/shared";

import { resolveCompressionOptions } from "../pipeline/defaults.js";
import type { CompressionState } from "../pipeline/types.js";

export function initCompressionState(
  input: ReviewContext,
  options?: CompressionOptions,
): CompressionState {
  return {
    input,
    options: resolveCompressionOptions(options),
    activeModules: [...input.modules],
    activeFiles: [...input.files],
    droppedFiles: new Map(),
    signalsByModule: new Map(),
    matchedCommitByModule: new Map(),
    coreChangeByModule: new Map(),
    logicChangesByModule: new Map(),
    architecturalImpactByModule: new Map(),
    compressedModules: [],
    topLevelSignals: [],
    output: null,
  };
}
