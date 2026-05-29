import type { ParsedFileDiff } from "../../types.js";
import type { PatternSet } from "../patterns/types.js";
import type { SemanticClass } from "../types.js";
import {
  collectSemanticLines,
  firstCapture,
  lineNumber,
  resolveChangeType,
} from "../utils/line-utils.js";

export function extractClasses(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): SemanticClass[] {
  const adds = new Set<string>();
  const removes = new Set<string>();
  const meta = new Map<string, { line?: number }>();

  for (const { line, changeSide } of collectSemanticLines(parsed.hunks)) {
    const name = firstCapture(patterns.class, line.content);
    if (!name) {
      continue;
    }

    if (changeSide === "add") {
      adds.add(name);
    } else {
      removes.add(name);
    }

    if (!meta.has(name)) {
      meta.set(name, { line: lineNumber(line) });
    }
  }

  const names = new Set([...adds, ...removes]);

  return [...names].map((name) => ({
    name,
    changeType: resolveChangeType(adds, removes, name),
    line: meta.get(name)?.line,
  }));
}
