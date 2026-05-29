import { describe, expect, it } from "vitest";

import { MockProvider } from "./mock-provider.js";
import { DEFAULT_MOCK_RESPONSE } from "./mock-fixtures.js";
import { StructuredLLMClient } from "./structured-llm-client.js";
import { summarySchemaValidator } from "./schema/summary-schema.js";
import { StructuredOutputError } from "../utils/errors.js";

describe("StructuredLLMClient", () => {
  it("returns validated structured result", async () => {
    const client = new StructuredLLMClient(
      new MockProvider({ response: DEFAULT_MOCK_RESPONSE }),
    );

    const result = await client.completeStructured(
      {
        messages: [{ role: "user", content: "summarize" }],
        model: "mock-model",
      },
      summarySchemaValidator,
    );

    expect(result.provider).toBe("mock");
    expect(result.result.intent).toContain("JWT");
    expect(result.attempts).toBe(1);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("retries malformed JSON responses", async () => {
    let callCount = 0;
    const provider = new MockProvider({
      response: DEFAULT_MOCK_RESPONSE,
    });
    const originalComplete = provider.complete.bind(provider);
    provider.complete = async (request) => {
      callCount += 1;
      if (callCount === 1) {
        return { content: "not-json", model: "mock-model" };
      }
      return originalComplete(request);
    };

    const client = new StructuredLLMClient(provider, { maxParseRetries: 1 });
    const result = await client.completeStructured(
      {
        messages: [{ role: "user", content: "summarize" }],
        model: "mock-model",
      },
      summarySchemaValidator,
    );

    expect(callCount).toBe(2);
    expect(result.attempts).toBe(2);
  });

  it("throws StructuredOutputError when schema validation fails", async () => {
    const client = new StructuredLLMClient(
      new MockProvider({ response: { invalid: true } }),
      { maxParseRetries: 0 },
    );

    await expect(
      client.completeStructured(
        {
          messages: [{ role: "user", content: "summarize" }],
          model: "mock-model",
        },
        summarySchemaValidator,
      ),
    ).rejects.toThrow(StructuredOutputError);
  });
});
