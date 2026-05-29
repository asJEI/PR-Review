import type { ContextLine } from "@pr-review/shared";

export function formatChangeLine(line: ContextLine): string {
  const prefix = line.type === "add" ? "+" : line.type === "delete" ? "-" : " ";
  const content = line.content.replace(/^[\-+ ]/, "");
  return `${prefix} ${content}`;
}

export function formatSnippetHeader(file: string, symbol: string | null): string {
  if (symbol) {
    return `// ${file} :: ${symbol}`;
  }
  return `// ${file}`;
}

export function formatFocusedDiff(
  file: string,
  symbol: string | null,
  changeLines: ContextLine[],
): string {
  const header = formatSnippetHeader(file, symbol);
  const body = changeLines.map(formatChangeLine).join("\n");
  return body.length > 0 ? `${header}\n${body}` : header;
}

export function formatSurroundingContextLines(contextLines: ContextLine[]): string {
  return contextLines
    .map((line) => line.content.replace(/^[\-+ ]/, "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export function formatAggressiveSummary(
  file: string,
  symbol: string | null,
  changeLines: ContextLine[],
): string {
  const adds = changeLines.filter((line) => line.type === "add").length;
  const dels = changeLines.filter((line) => line.type === "delete").length;
  const label = symbol ?? "file-level";
  return `${file} (${label}): ${adds} additions, ${dels} deletions`;
}
