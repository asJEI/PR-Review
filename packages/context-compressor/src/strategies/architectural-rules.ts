import type { EngineeringModuleContext } from "@pr-review/shared";

export function buildArchitecturalImpact(
  module: EngineeringModuleContext,
  allModules: EngineeringModuleContext[],
): string[] {
  const impacts: string[] = [];
  const fileSet = new Set(module.relatedFiles);

  const crossModuleHints = module.callChainHints.filter(
    (hint) => hint.confidence >= 0.6,
  );

  for (const hint of crossModuleHints) {
    impacts.push(
      `${hint.fromFile} ${hint.relationship} ${hint.symbol} in ${hint.toFile}`,
    );
  }

  const internalDeps = module.dependencies.filter(
    (edge) => edge.edgeType === "internal" && !fileSet.has(edge.to),
  );

  for (const edge of internalDeps.slice(0, 3)) {
    impacts.push(`Internal dependency: ${edge.from} imports ${edge.to}`);
  }

  const externalDeps = module.expandedDependencies.filter(
    (dep) => !dep.includes("/") && !dep.startsWith("."),
  );

  for (const dep of externalDeps.slice(0, 3)) {
    impacts.push(`Uses external module: ${dep}`);
  }

  if (module.relatedFiles.length >= 3) {
    impacts.push(`Multi-file coordinated change in ${module.module}`);
  }

  const touchesOtherModules = allModules.some((other) => {
    if (other.module === module.module) {
      return false;
    }

    return other.relatedFiles.some((file) =>
      module.expandedDependencies.includes(file),
    );
  });

  if (touchesOtherModules) {
    impacts.push("Cross-module dependency impact detected");
  }

  return [...new Set(impacts)];
}
