/** Rough token estimate: ~4 characters per token (conservative for code). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateObjectTokens(value: unknown): number {
  return estimateTokens(JSON.stringify(value));
}
