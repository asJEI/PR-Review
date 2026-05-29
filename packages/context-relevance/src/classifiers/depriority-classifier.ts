import type { FileContext } from "@pr-review/shared";

import { isLowValueChange } from "../utils/diff-noise-detect.js";

const NOISE_PATH_PATTERNS: RegExp[] = [
  /(?:^|\/)vendor\//i,
  /(?:^|\/)dist\//i,
  /(?:^|\/)node_modules\//i,
  /(?:^|\/)build\//i,
  /(?:^|\/)generated\//i,
  /(?:^|\/)__generated__\//i,
  /(?:^|\/)__snapshots__\//i,
  /(?:^|\/)package-lock\.json$/i,
  /(?:^|\/)pnpm-lock\.yaml$/i,
  /(?:^|\/)yarn\.lock$/i,
  /\.lock$/i,
  /\.min\.js$/i,
  /\.map$/i,
  /\.snap$/i,
];

export interface DepriorityResult {
  ignored: boolean;
  reason: string | null;
  testOnlyLow: boolean;
}

export function isNoisePath(filename: string): boolean {
  return NOISE_PATH_PATTERNS.some((pattern) => pattern.test(filename));
}

function allChangeLines(file: FileContext) {
  return file.hunks.flatMap((hunk) => hunk.changeLines);
}

export function classifyDepriority(
  file: FileContext,
  riskHints: string[],
): DepriorityResult {
  if (isNoisePath(file.filename)) {
    return { ignored: true, reason: "vendor/dist/lock/generated path", testOnlyLow: false };
  }

  const changeLines = allChangeLines(file);

  if (changeLines.length > 0 && isLowValueChange(changeLines)) {
    if (/\.(md|txt)$/i.test(file.filename)) {
      return { ignored: true, reason: "documentation-only update", testOnlyLow: false };
    }

    return { ignored: true, reason: "formatting or comments-only change", testOnlyLow: false };
  }

  const fileRiskHints = riskHints.filter((hint) => hint.includes(file.filename));
  const hasExportedSymbol = file.symbols.some(
    (symbol) => !symbol.name.startsWith("_") && !symbol.name.startsWith("test"),
  );

  if (
    /(?:^|\/)__tests__\//i.test(file.filename) &&
    fileRiskHints.length === 0 &&
    !hasExportedSymbol
  ) {
    return { ignored: false, reason: "test-only low-signal change", testOnlyLow: true };
  }

  return { ignored: false, reason: null, testOnlyLow: false };
}
