import type { FileContext, LineMappingInput } from "@pr-review/shared";

import { resolveFilePath } from "./edge-cases/path-resolver.js";
import type { FileLineIndex, LineIndex } from "./types.js";
import {
  allHunkRows,
  collectChangedNewLines,
  collectChangedOldLines,
} from "./utils/line-translation.js";

function buildFileIndex(file: FileContext): FileLineIndex {
  const hunks = file.hunks.map((hunk, hunkIndex) => ({
    hunkIndex,
    hunk,
    rows: allHunkRows(hunk, hunkIndex),
    changedNewLines: collectChangedNewLines(hunk),
    changedOldLines: collectChangedOldLines(hunk),
  }));

  return {
    file: file.filename,
    truncated: file.truncated,
    hunks,
    symbols: file.symbols,
  };
}

export function buildLineIndex(input: LineMappingInput): LineIndex {
  const pathAliases = input.pathAliases ?? {};
  const files = new Map<string, FileLineIndex>();

  for (const file of input.reviewContext.files) {
    files.set(file.filename, buildFileIndex(file));
  }

  for (const [previousPath, currentPath] of Object.entries(pathAliases)) {
    const current = files.get(currentPath);
    if (current && !files.has(previousPath)) {
      files.set(previousPath, { ...current, file: previousPath });
    }
  }

  return { files, pathAliases };
}

export function getFileIndex(
  index: LineIndex,
  file: string,
): FileLineIndex | undefined {
  if (index.files.has(file)) {
    return index.files.get(file);
  }
  const resolved = resolveFilePath(file, index.pathAliases);
  return index.files.get(resolved);
}

export function toLineMappingInput(
  reviewContext: LineMappingInput["reviewContext"],
  patchesByFile?: LineMappingInput["patchesByFile"],
  pathAliases?: LineMappingInput["pathAliases"],
): LineMappingInput {
  return { reviewContext, patchesByFile, pathAliases };
}
