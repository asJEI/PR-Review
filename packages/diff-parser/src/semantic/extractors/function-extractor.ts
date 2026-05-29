import type { ParsedFileDiff } from "../../types.js";
import type { PatternSet } from "../patterns/types.js";
import type { SemanticFunction } from "../types.js";
import {
  collectSemanticLines,
  detectClassScope,
  firstCapture,
  isAsyncLine,
  lineNumber,
  resolveChangeType,
} from "../utils/line-utils.js";

export function extractFunctions(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): SemanticFunction[] {
  const adds = new Set<string>();
  const removes = new Set<string>();
  const asyncByName = new Map<string, { add?: boolean; remove?: boolean }>();
  const meta = new Map<
    string,
    { scope?: string; line?: number; isAsync?: boolean }
  >();

  for (const hunk of parsed.hunks) {
    const lines = hunk.lines;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || (line.type !== "add" && line.type !== "delete")) {
        continue;
      }

      const name = firstCapture(patterns.function, line.content);
      if (!name) {
        continue;
      }

      const side = line.type === "add" ? adds : removes;
      side.add(name);

      const entry = asyncByName.get(name) ?? {};
      if (line.type === "add") {
        entry.add = isAsyncLine(line.content);
      } else {
        entry.remove = isAsyncLine(line.content);
      }
      asyncByName.set(name, entry);

      if (!meta.has(name)) {
        meta.set(name, {
          scope: detectClassScope(lines, i),
          line: lineNumber(line),
          isAsync: isAsyncLine(line.content),
        });
      }
    }
  }

  const names = new Set([...adds, ...removes]);
  const functions: SemanticFunction[] = [];

  for (const name of names) {
    const asyncEntry = asyncByName.get(name);
    functions.push({
      name,
      changeType: resolveChangeType(adds, removes, name),
      scope: meta.get(name)?.scope,
      line: meta.get(name)?.line,
      isAsync: asyncEntry?.add ?? asyncEntry?.remove,
    });
  }

  return functions;
}
