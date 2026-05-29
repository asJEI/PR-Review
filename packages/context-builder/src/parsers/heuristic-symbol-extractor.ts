import type { DiffLine } from "@pr-review/diff-parser";
import type { SymbolChange, SymbolChangeType, SymbolKind } from "@pr-review/shared";

import type { SymbolExtractor, SymbolExtractorInput } from "../interfaces/symbol-extractor.js";

interface SymbolPattern {
  kind: SymbolKind;
  regex: RegExp;
}

const PATTERNS: Record<string, SymbolPattern[]> = {
  typescript: [
    { kind: "class", regex: /^\s*(?:export\s+)?class\s+(\w+)/ },
    { kind: "interface", regex: /^\s*(?:export\s+)?interface\s+(\w+)/ },
    { kind: "type", regex: /^\s*(?:export\s+)?type\s+(\w+)/ },
    {
      kind: "function",
      regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    },
    {
      kind: "function",
      regex: /^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    },
    { kind: "method", regex: /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/ },
  ],
  javascript: [
    { kind: "class", regex: /^\s*(?:export\s+)?class\s+(\w+)/ },
    {
      kind: "function",
      regex: /^\s*(?:export\s+)?function\s+(\w+)/,
    },
    {
      kind: "function",
      regex: /^\s*(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    },
  ],
  python: [
    { kind: "class", regex: /^\s*class\s+(\w+)/ },
    { kind: "function", regex: /^\s*def\s+(\w+)/ },
    { kind: "function", regex: /^\s*async\s+def\s+(\w+)/ },
  ],
  go: [
    { kind: "function", regex: /^\s*func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/ },
    { kind: "type", regex: /^\s*type\s+(\w+)\s+/ },
  ],
};

function lineChangeType(line: DiffLine): SymbolChangeType {
  if (line.type === "add") {
    return "added";
  }

  if (line.type === "delete") {
    return "removed";
  }

  return "modified";
}

function detectScope(lines: DiffLine[], index: number): string | undefined {
  for (let i = index; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const classMatch = /^\s*class\s+(\w+)/.exec(line.content);
    if (classMatch?.[1]) {
      return classMatch[1];
    }
  }

  return undefined;
}

function extractFromLine(
  line: DiffLine,
  language: string,
  allLines: DiffLine[],
  lineIndex: number,
): SymbolChange | null {
  if (line.type !== "add" && line.type !== "delete") {
    return null;
  }

  const patterns = PATTERNS[language] ?? PATTERNS.typescript ?? [];

  for (const pattern of patterns) {
    const match = pattern.regex.exec(line.content);

    if (match?.[1]) {
      const scope = detectScope(allLines, lineIndex);

      return {
        name: match[1],
        kind: pattern.kind,
        changeType: lineChangeType(line),
        scope,
        line: line.newLineNumber ?? line.oldLineNumber ?? undefined,
      };
    }
  }

  return null;
}

export class HeuristicSymbolExtractor implements SymbolExtractor {
  readonly id = "heuristic";

  extract(input: SymbolExtractorInput): SymbolChange[] {
    const seen = new Set<string>();
    const symbols: SymbolChange[] = [];

    for (const hunk of input.parsedDiff.hunks) {
      const lines = hunk.lines;

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line) {
          continue;
        }

        const symbol = extractFromLine(
          line,
          input.language,
          lines,
          i,
        );

        if (!symbol) {
          continue;
        }

        const key = `${symbol.name}:${symbol.kind}:${symbol.changeType}`;

        if (seen.has(key) || symbols.length >= input.maxSymbols) {
          continue;
        }

        seen.add(key);
        symbols.push(symbol);
      }
    }

    return symbols;
  }
}
