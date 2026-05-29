import type { ContextLine, HunkContext, SymbolChange } from "@pr-review/shared";

export interface HunkLineRow {
  hunkIndex: number;
  line: ContextLine;
  isChange: boolean;
}

export interface IndexedHunk {
  hunkIndex: number;
  hunk: HunkContext;
  rows: HunkLineRow[];
  changedNewLines: number[];
  changedOldLines: number[];
}

export interface FileLineIndex {
  file: string;
  truncated: boolean;
  hunks: IndexedHunk[];
  symbols: SymbolChange[];
}

export interface LineIndex {
  files: Map<string, FileLineIndex>;
  pathAliases: Record<string, string>;
}
