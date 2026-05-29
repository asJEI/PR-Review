import { describe, expect, it } from "vitest";

import { createProvider, resolveProviderFromEnv } from "./provider-registry.js";

describe("provider-registry", () => {
  it("resolves openai when OPENAI_API_KEY is set", () => {
    const provider = resolveProviderFromEnv({ OPENAI_API_KEY: "sk-test" });
    expect(provider?.id).toContain("openai");
  });

  it("respects explicit LLM_PROVIDER=deepseek", () => {
    const provider = resolveProviderFromEnv({
      LLM_PROVIDER: "deepseek",
      DEEPSEEK_API_KEY: "ds-test",
    });
    expect(provider?.id).toContain("deepseek");
  });

  it("prefers openai over deepseek when both keys exist without explicit provider", () => {
    const provider = resolveProviderFromEnv({
      OPENAI_API_KEY: "sk-test",
      DEEPSEEK_API_KEY: "ds-test",
    });
    expect(provider?.id).toContain("openai");
  });

  it("creates provider from config", () => {
    const provider = createProvider({
      id: "anthropic",
      apiKey: "key",
      defaultModel: "claude-3-5-haiku-20241022",
    });
    expect(provider.id).toContain("anthropic");
  });
});
