import type { DiffLine } from "../../types.js";
import type { SemanticChangeType } from "../types.js";

export interface SemanticLine {
  line: DiffLine;
  changeSide: "add" | "delete";
}

export function collectSemanticLines(
  hunks: { lines: DiffLine[] }[],
): SemanticLine[] {
  const result: SemanticLine[] = [];

  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === "add") {
        result.push({ line, changeSide: "add" });
      } else if (line.type === "delete") {
        result.push({ line, changeSide: "delete" });
      }
    }
  }

  return result;
}

export function firstCapture(patterns: RegExp[], content: string): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(content);

    if (match?.[1]) {
      return match[1];
    }

    if (match && !match[1] && pattern.test(content)) {
      return content.trim();
    }
  }

  return null;
}

export function resolveChangeType(
  adds: Set<string>,
  removes: Set<string>,
  name: string,
): SemanticChangeType {
  const hasAdd = adds.has(name);
  const hasRemove = removes.has(name);

  if (hasAdd && hasRemove) {
    return "modified";
  }

  if (hasAdd) {
    return "added";
  }

  return "removed";
}

export function lineNumber(line: DiffLine): number | undefined {
  return line.newLineNumber ?? line.oldLineNumber ?? undefined;
}

export function detectClassScope(lines: DiffLine[], index: number): string | undefined {
  for (let i = index; i >= 0; i -= 1) {
    const content = lines[i]?.content;
    if (!content) {
      continue;
    }

    const match = /^\s*class\s+(\w+)/.exec(content);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

export function isAsyncLine(content: string): boolean {
  return /\basync\b/.test(content);
}
