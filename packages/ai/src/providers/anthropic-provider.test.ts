import { describe, expect, it, vi } from "vitest";

import { AnthropicProvider } from "./anthropic-provider.js";
import { LLMProviderError } from "../utils/errors.js";

describe("AnthropicProvider", () => {
  it("maps messages API request and usage", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        model: "claude-3-5-haiku-20241022",
        content: [{ type: "text", text: '{"risks":[],"overallRiskLevel":"low"}' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    );

    const provider = new AnthropicProvider({
      apiKey: "anthropic-key",
      fetchImpl,
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "analyze risks" }],
      model: "claude-3-5-haiku-20241022",
      responseFormat: "json",
    });

    expect(provider.id).toBe("anthropic");
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toContain("/messages");
    expect(init?.headers).toMatchObject({
      "x-api-key": "anthropic-key",
      "anthropic-version": "2023-06-01",
    });
    const body = JSON.parse(String(init?.body));
    expect(body.system).toContain("valid JSON");
    expect(result.usage?.promptTokens).toBe(100);
    expect(result.usage?.completionTokens).toBe(50);
  });

  it("throws LLMProviderError on 429", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: { message: "rate limited" } }, { status: 429 }),
    );

    const provider = new AnthropicProvider({ apiKey: "anthropic-key", fetchImpl });

    await expect(
      provider.complete({
        messages: [{ role: "user", content: "test" }],
        model: "claude-3-5-haiku-20241022",
      }),
    ).rejects.toMatchObject({ statusCode: 429 });
  });
});
