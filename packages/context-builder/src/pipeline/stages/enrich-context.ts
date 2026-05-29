import { runEnrichers } from "../../enrichers/run-enrichers.js";
import type { PipelineState } from "../types.js";

export function enrichContext(state: PipelineState): PipelineState {
  return runEnrichers(state);
}
