import { describe, expect, it } from "vitest";

import type { LLMCompletionRequest, LLMCompletionResponse, LLMProvider } from "../../providers/llm-provider.js";
import { DEFAULT_MOCK_RESPONSE } from "../../providers/mock-fixtures.js";
import { StructuredOutputError } from "../../utils/errors.js";
import { runWithAgentRecovery } from "./review-execution-recovery.js";
import { CollectingReviewStreamSink } from "../streaming/review-stream-sink.js";

class FailOnceProvider implements LLMProvider {
  readonly id = "mock";
  private calls = 0;

  async complete(_request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    this.calls += 1;
    if (this.calls === 1) {
      throw new StructuredOutputError("invalid json", "{bad", ["invalid json"]);
    }

    return {
      content: JSON.stringify(DEFAULT_MOCK_RESPONSE),
      model: "mock-model",
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    };
  }
}

describe("review-execution-recovery", () => {
  it("re-runs failed agent on StructuredOutputError", async () => {
    const provider = new FailOnceProvider();
    let attempts = 0;

    const result = await runWithAgentRecovery(
      "summary",
      async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new StructuredOutputError("invalid json", "{bad", ["invalid json"]);
        }
        return { ok: true };
      },
      { maxAgentRetries: 1 },
    );

    expect(result.result).toEqual({ ok: true });
    expect(result.attempts).toBe(2);
    expect(provider.calls).toBeGreaterThanOrEqual(0);
  });

  it("emits stream phase events", async () => {
    const sink = new CollectingReviewStreamSink();

    await runWithAgentRecovery(
      "risk",
      async () => ({ ok: true }),
      { maxAgentRetries: 0, streamSink: sink },
    );

    expect(sink.events.map((event) => event.phase)).toEqual(["started", "completed"]);
  });
});
