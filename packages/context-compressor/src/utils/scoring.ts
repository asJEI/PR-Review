import type { CompressedModuleContext } from "@pr-review/shared";

export function computePriorityScore(module: CompressedModuleContext): number {
  const riskWeight = module.riskContext.length * 20;
  const logicWeight = module.logicChanges.length * 5;
  const functionWeight = module.affectedFunctions.length * 3;
  const architecturalWeight = module.architecturalImpact.length * 8;
  const fileWeight = module.dependencies.length;

  const raw =
    riskWeight + logicWeight + functionWeight + architecturalWeight + fileWeight;

  return Math.min(100, raw);
}

export function moduleHasProtectedSignals(
  module: CompressedModuleContext,
): boolean {
  return module.riskContext.some((hint) =>
    /auth|database|db\b|error handling|async|cache|concurr/i.test(hint),
  );
}
