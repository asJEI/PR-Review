export function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function maxConfidence(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return clampConfidence(Math.max(...values));
}

export function truncateEvidence(text: string, maxLength = 80): string {
  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}
