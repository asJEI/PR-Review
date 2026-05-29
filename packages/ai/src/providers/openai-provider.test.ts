import { describe, expect, it, vi } from "vitest";

import { OpenAIProvider } from "./openai-provider.js";
import { LLMProviderError } from "../utils/errors.js";

describe("OpenAIProvider", () => {
  it("sends chat completion request with json response format", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        model: "gpt-4o-mini",
        choices: [{ message: { content: '{"intent":"ok","coreChanges":["a"],"affectedModules":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    );

    const provider = new OpenAIProvider({
      apiKey: "test-key",
      baseUrl: "https://example.com/v1",
      fetchImpl,
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "summarize" }],
      model: "gpt-4o-mini",
      responseFormat: "json",
    });

    expect(provider.id).toBe("openai");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://example.com/v1/chat/completions");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
    const body = JSON.parse(String(init?.body));
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(result.content).toContain("intent");
    expect(result.usage?.promptTokens).toBe(10);
  });

  it("throws LLMProviderError on HTTP failure", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: { message: "rate limited" } }, { status: 429 }),
    );

    const provider = new OpenAIProvider({ apiKey: "test-key", fetchImpl });

    await expect(
      provider.complete({
        messages: [{ role: "user", content: "summarize" }],
        model: "gpt-4o-mini",
      }),
    ).rejects.toThrow(LLMProviderError);
  });
});
