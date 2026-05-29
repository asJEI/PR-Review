export function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateObjectTokens(value: unknown): number {
  return Math.ceil(JSON.stringify(value).length / 4);
}
