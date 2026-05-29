import type { ParsedFileDiff } from "../../types.js";
import type { PatternSet } from "../patterns/types.js";
import { firstCapture, isAsyncLine } from "../utils/line-utils.js";

/**
 * Detects async keyword changes on the same function name across +/- lines.
 */
export function detectAsyncChanges(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): boolean {
  const byName = new Map<string, { addAsync?: boolean; removeAsync?: boolean }>();

  for (const hunk of parsed.hunks) {
    for (const line of hunk.lines) {
      if (line.type !== "add" && line.type !== "delete") {
        continue;
      }

      const name = firstCapture(patterns.function, line.content);
      if (!name) {
        continue;
      }

      const entry = byName.get(name) ?? {};
      const asyncFlag = isAsyncLine(line.content);

      if (line.type === "add") {
        entry.addAsync = asyncFlag;
      } else {
        entry.removeAsync = asyncFlag;
      }

      byName.set(name, entry);
    }
  }

  for (const entry of byName.values()) {
    if (
      entry.addAsync !== undefined &&
      entry.removeAsync !== undefined &&
      entry.addAsync !== entry.removeAsync
    ) {
      return true;
    }
  }

  return false;
}
