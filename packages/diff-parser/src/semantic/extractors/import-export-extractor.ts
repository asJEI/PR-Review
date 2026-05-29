import type { ParsedFileDiff } from "../../types.js";
import type { PatternSet } from "../patterns/types.js";
import type { ModuleChanges } from "../types.js";
import { collectSemanticLines, firstCapture } from "../utils/line-utils.js";

function extractModuleChanges(
  parsed: ParsedFileDiff,
  patterns: RegExp[],
): ModuleChanges {
  const added: string[] = [];
  const removed: string[] = [];
  const seenAdd = new Set<string>();
  const seenRemove = new Set<string>();

  for (const { line, changeSide } of collectSemanticLines(parsed.hunks)) {
    const specifier = firstCapture(patterns, line.content);
    if (!specifier) {
      continue;
    }

    if (changeSide === "add") {
      if (!seenAdd.has(specifier)) {
        seenAdd.add(specifier);
        added.push(specifier);
      }
    } else if (!seenRemove.has(specifier)) {
      seenRemove.add(specifier);
      removed.push(specifier);
    }
  }

  return { added, removed };
}

export function extractImports(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): ModuleChanges {
  return extractModuleChanges(parsed, patterns.import);
}

export function extractExports(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): ModuleChanges {
  return extractModuleChanges(parsed, patterns.export);
}
