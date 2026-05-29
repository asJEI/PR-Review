import type {
  LineMappingConfidence,
  LineMappingInput,
  LineMappingOptions,
  SymbolDiffMapping,
} from "@pr-review/shared";

import { buildLineIndex, getFileIndex } from "./build-line-index.js";
import { resolveFilePath } from "./edge-cases/path-resolver.js";
import { downgradeConfidenceForTruncated, hasUsablePatch } from "./edge-cases/truncated-file.js";
import { locateHunkByLine, locateHunksBySymbol, pickBestHunkMatch } from "./hunk-locator.js";
import { calculatePatchPosition } from "./patch-position-calculator.js";
import type { FileLineIndex } from "./types.js";
import { hunkLineRange } from "./utils/line-translation.js";

const DEFAULT_OPTIONS: Required<LineMappingOptions> = {
  preferChangeLines: true,
  symbolProximity: 3,
};

function resolveOptions(options?: LineMappingOptions): Required<LineMappingOptions> {
  return { ...DEFAULT_OPTIONS, ...options };
}

function confidenceForLocated(
  onChangeLine: boolean,
  inferredOnly: boolean,
): LineMappingConfidence {
  if (inferredOnly) {
    return "inferred";
  }
  if (onChangeLine) {
    return "exact";
  }
  return "approximate";
}

function buildMappingFromHunk(
  file: string,
  symbol: string | null,
  fileIndex: FileLineIndex,
  hunkIndex: number,
  side: SymbolDiffMapping["side"],
  startLine: number,
  endLine: number,
  confidence: LineMappingConfidence,
  patch: string | null | undefined,
): SymbolDiffMapping {
  const indexed = fileIndex.hunks[hunkIndex];
  const changedLines =
    side === "LEFT"
      ? (indexed?.changedOldLines ?? [])
      : (indexed?.changedNewLines ?? []);

  const oldRange = indexed ? hunkLineRange(indexed.hunk, "LEFT") : null;

  let githubPosition: number | undefined;
  if (patch && hasUsablePatch(patch, fileIndex.truncated)) {
    const position = calculatePatchPosition(patch, { side, line: startLine });
    if (position !== null) {
      githubPosition = position;
    }
  }

  const mapping: SymbolDiffMapping = {
    file,
    symbol,
    hunkIndex,
    startLine,
    endLine,
    changedLines,
    oldStartLine: oldRange?.start,
    oldEndLine: oldRange?.end,
    side,
    githubPosition,
    confidence,
    truncated: fileIndex.truncated,
  };

  return downgradeConfidenceForTruncated(mapping, fileIndex.truncated);
}

export function mapSymbolToDiff(
  input: LineMappingInput,
  file: string,
  symbol: string,
  options?: LineMappingOptions,
): SymbolDiffMapping | null {
  const resolved = resolveOptions(options);
  const index = buildLineIndex(input);
  const resolvedFile = resolveFilePath(file, index.pathAliases);
  const fileIndex = getFileIndex(index, resolvedFile);
  if (!fileIndex) {
    return null;
  }

  const symbolMeta = fileIndex.symbols.find((entry) => entry.name === symbol);
  const matches = locateHunksBySymbol(
    fileIndex,
    symbol,
    symbolMeta?.line,
    resolved.symbolProximity,
  );
  const best = pickBestHunkMatch(matches);
  if (!best) {
    return null;
  }

  const indexed = fileIndex.hunks[best.hunkIndex];
  if (!indexed) {
    return null;
  }

  const range = hunkLineRange(indexed.hunk, "RIGHT");
  const startLine = range?.start ?? indexed.hunk.newStart;
  const endLine = range?.end ?? startLine;
  const patch = input.patchesByFile?.[resolvedFile] ?? input.patchesByFile?.[file] ?? null;

  return buildMappingFromHunk(
    resolvedFile,
    symbol,
    fileIndex,
    best.hunkIndex,
    "RIGHT",
    startLine,
    endLine,
    confidenceForLocated(best.onChangeLine, false),
    patch,
  );
}

export function mapAllSymbolLocations(
  input: LineMappingInput,
  file: string,
  symbol: string,
  options?: LineMappingOptions,
): SymbolDiffMapping[] {
  const resolved = resolveOptions(options);
  const index = buildLineIndex(input);
  const resolvedFile = resolveFilePath(file, index.pathAliases);
  const fileIndex = getFileIndex(index, resolvedFile);
  if (!fileIndex) {
    return [];
  }

  const symbolMeta = fileIndex.symbols.find((entry) => entry.name === symbol);
  const matches = locateHunksBySymbol(
    fileIndex,
    symbol,
    symbolMeta?.line,
    resolved.symbolProximity,
  );

  const patch = input.patchesByFile?.[resolvedFile] ?? input.patchesByFile?.[file] ?? null;

  return matches.map((match) => {
    const indexed = fileIndex.hunks[match.hunkIndex]!;
    const range = hunkLineRange(indexed.hunk, "RIGHT");
    const startLine = range?.start ?? indexed.hunk.newStart;
    const endLine = range?.end ?? startLine;
    return buildMappingFromHunk(
      resolvedFile,
      symbol,
      fileIndex,
      match.hunkIndex,
      "RIGHT",
      startLine,
      endLine,
      confidenceForLocated(match.onChangeLine, false),
      patch,
    );
  });
}

export function mapLineToDiff(
  input: LineMappingInput,
  file: string,
  line: number,
  side?: SymbolDiffMapping["side"],
): SymbolDiffMapping | null {
  const index = buildLineIndex(input);
  const resolvedFile = resolveFilePath(file, index.pathAliases);
  const fileIndex = getFileIndex(index, resolvedFile);
  if (!fileIndex) {
    return null;
  }

  const located = locateHunkByLine(index, resolvedFile, line, side);
  if (!located) {
    return null;
  }

  const patch = input.patchesByFile?.[resolvedFile] ?? input.patchesByFile?.[file] ?? null;
  const inferredOnly = !located.onChangeLine && located.row.line.content === "";

  return buildMappingFromHunk(
    resolvedFile,
    null,
    fileIndex,
    located.hunkIndex,
    located.side,
    located.lineNumber,
    located.lineNumber,
    confidenceForLocated(located.onChangeLine, inferredOnly),
    patch,
  );
}
