export function estimateObjectTokens(value: unknown): number {
  return Math.ceil(JSON.stringify(value).length / 4);
}
