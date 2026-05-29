import type { MergedModuleContext } from "../pipeline/types.js";

export function formatModuleContext(
  modules: MergedModuleContext[],
  maxModules: number,
): string {
  const lines: string[] = [];

  for (const entry of modules.slice(0, maxModules)) {
    const { compressed, relevanceScore, priority } = entry;
    lines.push(
      `### [${priority}] ${entry.module} (relevance: ${relevanceScore.toFixed(2)})`,
      compressed.coreChange,
    );

    if (compressed.architecturalImpact.length > 0) {
      lines.push("", "Architectural impact:");
      for (const impact of compressed.architecturalImpact) {
        lines.push(`- ${impact}`);
      }
    }

    if (compressed.logicChanges.length > 0) {
      lines.push("", "Logic changes:");
      for (const change of compressed.logicChanges) {
        lines.push(
          `- ${change.symbol} (${change.kind}, ${change.changeType}): ${change.whatChanged}`,
          `  Why it matters: ${change.whyItMatters}`,
        );
      }
    }

    if (compressed.expandedDependencies.length > 0) {
      lines.push("", "Expanded dependencies:", ...compressed.expandedDependencies.map((dep) => `- ${dep}`));
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

export function formatArchitecturalSignals(modules: MergedModuleContext[]): string {
  const impacts = modules.flatMap((entry) =>
    entry.compressed.architecturalImpact.map((impact) => `- [${entry.module}] ${impact}`),
  );

  if (impacts.length === 0) {
    return "No explicit architectural impact signals detected.";
  }

  return impacts.join("\n");
}
