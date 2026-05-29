import type { ParsedFileDiff } from "../../types.js";

export interface ChangedLineText {
  content: string;
  side: "add" | "delete";
}

export function collectChangedLines(parsed: ParsedFileDiff): ChangedLineText[] {
  const lines: ChangedLineText[] = [];

  for (const hunk of parsed.hunks) {
    for (const line of hunk.lines) {
      if (line.type === "add") {
        lines.push({ content: line.content, side: "add" });
      } else if (line.type === "delete") {
        lines.push({ content: line.content, side: "delete" });
      }
    }
  }

  return lines;
}

export function joinChangedText(parsed: ParsedFileDiff): string {
  return collectChangedLines(parsed)
    .map((line) => line.content)
    .join("\n");
}

export function pathContainsAny(path: string, keywords: readonly string[]): string | null {
  const lower = path.toLowerCase();

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}

export function textContainsAny(
  text: string,
  keywords: readonly string[],
): string | null {
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}

export function importsText(semantic: {
  imports: { added: string[]; removed: string[] };
}): string {
  return [...semantic.imports.added, ...semantic.imports.removed].join(" ");
}

export function symbolNames(semantic: {
  functions: { name: string }[];
  classes: { name: string }[];
}): string[] {
  return [
    ...semantic.functions.map((fn) => fn.name),
    ...semantic.classes.map((cls) => cls.name),
  ];
}
