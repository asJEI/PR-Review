export function clampScore(score: number): number {
  return Math.min(1, Math.max(0, score));
}

export function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}
