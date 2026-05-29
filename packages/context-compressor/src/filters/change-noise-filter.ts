import type { FileContext, HunkContext } from "@pr-review/shared";

import { isLowValueChange } from "../utils/diff-noise-detect.js";

function allChangeLines(file: FileContext): HunkContext["changeLines"][number][] {
  return file.hunks.flatMap((hunk: HunkContext) => hunk.changeLines);
}

export function isFormattingOnlyFile(file: FileContext): boolean {
  const changeLines = allChangeLines(file);

  if (changeLines.length === 0) {
    return false;
  }

  return isLowValueChange(changeLines);
}

export function isEmptySymbolNoRiskFile(
  file: FileContext,
  moduleRiskHints: string[],
): boolean {
  const hasSymbols = file.symbols.length > 0;
  const hasRisk =
    moduleRiskHints.some((hint) => hint.includes(file.filename)) ||
    file.symbols.length > 0;

  if (hasSymbols || hasRisk) {
    return false;
  }

  return isFormattingOnlyFile(file);
}

export function changeNoiseReason(file: FileContext): string | null {
  const changeLines = allChangeLines(file);

  if (changeLines.length === 0) {
    return null;
  }

  if (isLowValueChange(changeLines)) {
    return "formatting or comments-only change";
  }

  return null;
}
