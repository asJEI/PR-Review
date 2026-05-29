import type { ContextLine, HunkContext } from "@pr-review/shared";

import {
  buildHunksWithProximityContext,
  trimContextLinesByProximity,
} from "../../utils/hunk-context.js";
import type { ParsedFileEntry } from "../types.js";

export function buildHunksForFile(
  entry: ParsedFileEntry,
  maxContextLinesPerHunk: number,
): HunkContext[] {
  return buildHunksWithProximityContext(entry, maxContextLinesPerHunk);
}

export { trimContextLinesByProximity };
export type { ContextLine };
