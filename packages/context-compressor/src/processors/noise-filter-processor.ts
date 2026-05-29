import { changeNoiseReason, isFormattingOnlyFile } from "../filters/change-noise-filter.js";
import { isNoisePath, noisePathReason } from "../filters/path-noise-filter.js";
import type { CompressionProcessor } from "./compression-processor.js";
import type { CompressionState } from "../pipeline/types.js";

export class NoiseFilterProcessor implements CompressionProcessor {
  readonly id = "noise-filter";

  process(state: CompressionState): CompressionState {
    if (!state.options.dropNoiseFiles) {
      return state;
    }

    const droppedFiles = new Map(state.droppedFiles);
    const activeFileSet = new Set<string>();

    for (const file of state.activeFiles) {
      let dropReason: string | null = null;

      if (isNoisePath(file.filename)) {
        dropReason = noisePathReason(file.filename);
      } else {
        dropReason = changeNoiseReason(file);
      }

      if (dropReason) {
        droppedFiles.set(file.filename, dropReason);
        continue;
      }

      if (
        file.symbols.length === 0 &&
        isFormattingOnlyFile(file) &&
        !state.input.semanticSummary.riskHints.some((hint) =>
          hint.includes(file.filename),
        )
      ) {
        droppedFiles.set(file.filename, "formatting or comments-only change");
        continue;
      }

      activeFileSet.add(file.filename);
    }

    const activeFiles = state.activeFiles.filter((file) =>
      activeFileSet.has(file.filename),
    );

    const activeModules = state.activeModules
      .map((module) => ({
        ...module,
        relatedFiles: module.relatedFiles.filter((file) =>
          activeFileSet.has(file),
        ),
      }))
      .filter((module) => module.relatedFiles.length > 0);

    return {
      ...state,
      activeFiles,
      activeModules,
      droppedFiles,
    };
  }
}
