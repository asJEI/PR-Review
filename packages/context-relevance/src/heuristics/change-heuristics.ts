import type { FileContext } from "@pr-review/shared";

export function scoreChangeHeuristics(file: FileContext): { boost: number; reasons: string[] } {
  const reasons: string[] = [];
  let boost = 0;

  const changeVolume = file.additions + file.deletions;

  if (changeVolume > 80) {
    boost += 0.05;
    reasons.push("large change volume");
  }

  if (file.status === "added") {
    boost += 0.03;
    reasons.push("new file added");
  }

  if (file.symbols.length > 0) {
    const symbolBoost = Math.min(0.15, file.symbols.length * 0.05);
    boost += symbolBoost;
    reasons.push(`${file.symbols.length} symbol(s) changed`);
  }

  return { boost, reasons };
}

export function countImportHub(filename: string, edges: { from: string }[]): boolean {
  const outDegree = edges.filter((edge) => edge.from === filename).length;
  return outDegree >= 2;
}
