import { buildHunksWithProximityContext } from "../utils/hunk-context.js";
import type { ContextEnricher } from "./context-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

export class SurroundingContextEnricher implements ContextEnricher {
  readonly id = "surrounding-context";

  enrich(state: PipelineState): PipelineState {
    const enrichedHunksByFile = new Map(state.enrichedHunksByFile);

    for (const entry of state.parsedFiles) {
      const filename = entry.changedFile.filename;
      const hasPatch =
        entry.changedFile.patch !== null && !entry.parsedDiff.isEmpty;

      if (!hasPatch) {
        continue;
      }

      enrichedHunksByFile.set(
        filename,
        buildHunksWithProximityContext(
          entry,
          state.options.maxContextLinesPerHunk,
        ),
      );
    }

    return { ...state, enrichedHunksByFile };
  }
}
