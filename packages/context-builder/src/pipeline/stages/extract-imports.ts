import { mapSemanticToImportEdges } from "../../adapters/semantic-adapters.js";
import type { PipelineState } from "../types.js";

export function extractImports(state: PipelineState): PipelineState {
  const changedFilenames = state.parsedFiles.map(
    (e) => e.changedFile.filename,
  );
  const importsByFile = new Map<
    string,
    import("@pr-review/shared").ImportEdge[]
  >();

  for (const entry of state.parsedFiles) {
    const imports = mapSemanticToImportEdges(
      entry.changedFile.filename,
      entry.semantic,
      changedFilenames,
    );

    importsByFile.set(entry.changedFile.filename, imports);
  }

  return { ...state, importsByFile };
}
