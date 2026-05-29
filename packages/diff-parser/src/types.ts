export type DiffLineType = "add" | "delete" | "context" | "no_newline";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  /** Raw @@ header line. */
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface ParsedFileDiff {
  filename: string;
  hunks: DiffHunk[];
  /** True when patch was null or empty. */
  isEmpty: boolean;
}
