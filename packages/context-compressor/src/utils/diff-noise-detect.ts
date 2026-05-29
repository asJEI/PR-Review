import type { ContextLine } from "@pr-review/shared";

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

export function isCommentsOnlyChange(changeLines: ContextLine[]): boolean {
  if (changeLines.length === 0) {
    return false;
  }

  return changeLines.every((line) => isCommentLine(line.content));
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

export function isLowValueChange(changeLines: ContextLine[]): boolean {
  return (
    changeLines.length === 0 ||
    isFormattingOnlyChange(changeLines) ||
    isCommentsOnlyChange(changeLines)
  );
}
