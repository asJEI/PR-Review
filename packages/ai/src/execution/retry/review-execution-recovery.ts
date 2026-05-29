import { StructuredOutputError } from "../../utils/errors.js";
import type { ReviewStreamAgent, ReviewStreamSink } from "../streaming/review-stream-sink.js";

export interface AgentRecoveryOptions {
  maxAgentRetries: number;
  streamSink?: ReviewStreamSink;
}

export interface AgentRecoveryResult<T> {
  result: T;
  attempts: number;
  latencyMs: number;
}

export async function runWithAgentRecovery<T>(
  agent: ReviewStreamAgent,
  fn: () => Promise<T>,
  options: AgentRecoveryOptions,
): Promise<AgentRecoveryResult<T>> {
  const streamSink = options.streamSink;
  const maxAttempts = Math.max(1, options.maxAgentRetries + 1);
  let attempts = 0;
  let lastError: unknown;

  await streamSink?.onEvent({ agent, phase: "started" });

  const started = performance.now();

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const result = await fn();
      const latencyMs = Math.round(performance.now() - started);
      await streamSink?.onEvent({ agent, phase: "completed", partial: result });
      return { result, attempts, latencyMs };
    } catch (error) {
      lastError = error;
      const isStructured = error instanceof StructuredOutputError;
      if (!isStructured || attempts >= maxAttempts) {
        await streamSink?.onEvent({
          agent,
          phase: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  await streamSink?.onEvent({
    agent,
    phase: "failed",
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  throw lastError;
}
