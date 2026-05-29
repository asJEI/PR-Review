import { javascriptPatterns } from "./javascript.js";
import { pythonPatterns } from "./python.js";
import { typescriptPatterns } from "./typescript.js";
import type { PatternSet } from "./types.js";

const PATTERN_MAP: Record<string, PatternSet> = {
  typescript: typescriptPatterns,
  javascript: javascriptPatterns,
  python: pythonPatterns,
  unknown: typescriptPatterns,
};

export function getPatterns(language: string): PatternSet {
  return PATTERN_MAP[language] ?? typescriptPatterns;
}

export type { PatternSet };
