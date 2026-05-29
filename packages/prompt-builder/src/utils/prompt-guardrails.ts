const DIFF_MARKERS = [/^@@\s/m, /^\+\+\+\s/m, /^---\s/m, /^diff --git/m];

export function containsDiffMarkers(text: string): boolean {
  return DIFF_MARKERS.some((pattern) => pattern.test(text));
}

export function assertNoDiffMarkers(text: string, label: string): void {
  if (containsDiffMarkers(text)) {
    throw new Error(`Prompt guardrail violated: raw diff markers detected in ${label}`);
  }
}

export function sanitizePromptText(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.startsWith("@@") && !line.startsWith("+++ ") && !line.startsWith("--- "))
    .join("\n");
}
