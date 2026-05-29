import type { LineMappingInput, LineMappingOptions, SymbolDiffMapping } from "@pr-review/shared";

import { mapLineToDiff, mapSymbolToDiff } from "./symbol-diff-mapper.js";
import { resolveFilePath } from "./edge-cases/path-resolver.js";
import { buildLineIndex, getFileIndex } from "./build-line-index.js";

export interface CommentLocationInput {
  file: string;
  line: number | null;
  symbol: string | null;
  lineHint?: string | null;
}

export function mapCommentToLocation(
  input: LineMappingInput,
  comment: CommentLocationInput,
  options?: LineMappingOptions,
): SymbolDiffMapping | null {
  const index = buildLineIndex(input);
  const resolvedFile = resolveFilePath(comment.file, index.pathAliases);
  const fileIndex = getFileIndex(index, resolvedFile);

  const hint = comment.lineHint ?? (comment.line !== null ? String(comment.line) : null);
  const numericHint = hint ? Number.parseInt(hint, 10) : Number.NaN;

  if (!Number.isNaN(numericHint)) {
    return mapLineToDiff(input, resolvedFile, numericHint);
  }

  if (comment.symbol) {
    const mapping = mapSymbolToDiff(input, resolvedFile, comment.symbol, options);
    if (mapping) {
      return mapping;
    }
  }

  if (!fileIndex) {
    return null;
  }

  return null;
}

export function resolveCommentLineNumber(
  input: LineMappingInput,
  comment: CommentLocationInput,
  options?: LineMappingOptions,
): number | null {
  const mapping = mapCommentToLocation(input, comment, options);
  if (!mapping) {
    return null;
  }
  if (mapping.confidence === "inferred" && mapping.changedLines.length === 0) {
    return null;
  }
  return mapping.startLine;
}
