import type { ExtractedSignal } from "../pipeline/types.js";

const PATH_RULES: Array<{ pattern: RegExp; label: string; category: string }> = [
  { pattern: /(?:^|\/)auth(?:\/|$)/i, label: "Auth module path", category: "authLogicChanged" },
  { pattern: /(?:^|\/)cache(?:\/|$)|redis/i, label: "Cache layer path", category: "cacheLayerTouched" },
  { pattern: /(?:^|\/)db(?:\/|$)|database|migration/i, label: "Database path", category: "databaseOperationModified" },
  { pattern: /async|await|concurrent/i, label: "Async/concurrency path", category: "asyncIntroduced" },
];

export function extractPathSignals(relatedFiles: string[]): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];
  const seen = new Set<string>();

  for (const file of relatedFiles) {
    for (const rule of PATH_RULES) {
      if (!rule.pattern.test(file) || seen.has(rule.label)) {
        continue;
      }

      seen.add(rule.label);
      signals.push({
        kind: "path",
        label: rule.label,
        weight: 10,
        category: rule.category,
      });
    }
  }

  return signals;
}

export function extractDependencySignals(
  expandedDependencies: string[],
): ExtractedSignal[] {
  const external = expandedDependencies.filter(
    (dep) => !dep.includes("/") && !dep.startsWith("."),
  );

  return external.slice(0, 5).map((dep) => ({
    kind: "architectural" as const,
    label: `External dependency: ${dep}`,
    weight: 6,
  }));
}
