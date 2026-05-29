export { buildLineIndex, getFileIndex, toLineMappingInput } from "./build-line-index.js";
export {
  mapCommentToLocation,
  resolveCommentLineNumber,
  type CommentLocationInput,
} from "./comment-mapper.js";
export { buildPathAliases, resolveFilePath } from "./edge-cases/path-resolver.js";
export {
  formatGitHubReviewComment,
  formatGitHubReviewComments,
  type FormatGitHubReviewOptions,
} from "./github-review-formatter.js";
export {
  locateHunkByLine,
  locateHunksBySymbol,
  pickBestHunkMatch,
  type LocatedLine,
  type RankedHunkMatch,
} from "./hunk-locator.js";
export {
  calculatePatchPosition,
  walkPatchPositions,
  type PatchPositionTarget,
} from "./patch-position-calculator.js";
export {
  mapAllSymbolLocations,
  mapLineToDiff,
  mapSymbolToDiff,
} from "./symbol-diff-mapper.js";

export type {
  FileLineIndex,
  HunkLineRow,
  IndexedHunk,
  LineIndex,
} from "./types.js";

export type {
  DiffSide,
  LineMappingConfidence,
  LineMappingInput,
  LineMappingOptions,
  LineMappingRange,
  SymbolDiffMapping,
} from "@pr-review/shared";
