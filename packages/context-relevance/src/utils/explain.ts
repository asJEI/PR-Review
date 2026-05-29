export function mergeReasons(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    for (const reason of group) {
      if (!seen.has(reason)) {
        seen.add(reason);
        merged.push(reason);
      }
    }
  }

  return merged;
}
