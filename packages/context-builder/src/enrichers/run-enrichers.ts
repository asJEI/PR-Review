import { CallChainEnricher } from "./call-chain-enricher.js";
import type { ContextEnricher } from "./context-enricher.js";
import { DependencyExpansionEnricher } from "./dependency-expansion-enricher.js";
import { RiskContextEnricher } from "./risk-context-enricher.js";
import { SurroundingContextEnricher } from "./surrounding-context-enricher.js";
import type { PipelineState } from "../pipeline/types.js";

export function createDefaultEnrichers(): ContextEnricher[] {
  return [
    new SurroundingContextEnricher(),
    new DependencyExpansionEnricher(),
    new CallChainEnricher(),
    new RiskContextEnricher(),
  ];
}

export function runEnrichers(
  state: PipelineState,
  enrichers: ContextEnricher[] = createDefaultEnrichers(),
): PipelineState {
  return enrichers.reduce((current, enricher) => enricher.enrich(current), state);
}
