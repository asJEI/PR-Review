import type { ContextLine, FileContext, HunkContext } from "@pr-review/shared";

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

function stripDiffPrefix(content: string): string {
  return content.replace(/^[\-+ ]/, "").trim();
}

function isCommentLine(content: string): boolean {
  const trimmed = stripDiffPrefix(content).trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("--")
  );
}

export function isNoisePath(filename: string): boolean {
  return NOISE_PATH_PATTERNS.some((pattern) => pattern.test(filename));
}

export function isFormattingOnlyChange(changeLines: ContextLine[]): boolean {
  if (changeLines.length === 0) {
    return false;
  }
  return changeLines.every((line) => {
    const stripped = stripDiffPrefix(line.content);
    return stripped.length === 0 || /^\s+$/.test(stripped);
  });
}

export function isCommentsOnlyChange(changeLines: ContextLine[]): boolean {
  if (changeLines.length === 0) {
    return false;
  }
  return changeLines.every((line) => isCommentLine(line.content));
}

export function isLowValueHunk(hunk: HunkContext): boolean {
  return (
    hunk.changeLines.length === 0 ||
    isFormattingOnlyChange(hunk.changeLines) ||
    isCommentsOnlyChange(hunk.changeLines)
  );
}

export function shouldSkipFile(file: FileContext): boolean {
  if (isNoisePath(file.filename)) {
    return true;
  }
  if (file.hunks.length === 0) {
    return true;
  }
  return file.hunks.every((hunk) => isLowValueHunk(hunk));
}

export function filterEligibleFiles(files: FileContext[]): FileContext[] {
  return files.filter((file) => !shouldSkipFile(file));
}

export function filterEligibleHunks(hunks: HunkContext[]): HunkContext[] {
  return hunks.filter((hunk) => !isLowValueHunk(hunk));
}
