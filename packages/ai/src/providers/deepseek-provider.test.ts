import { describe, expect, it } from "vitest";

import { DeepSeekProvider, createDeepSeekProviderFromEnv } from "./deepseek-provider.js";

describe("DeepSeekProvider", () => {
  it("uses deepseek id and default base url", () => {
    const provider = new DeepSeekProvider({ apiKey: "ds-key" });
    expect(provider.id).toBe("deepseek");
  });

  it("creates provider from env", () => {
    const provider = createDeepSeekProviderFromEnv({
      DEEPSEEK_API_KEY: "ds-key",
      DEEPSEEK_MODEL: "deepseek-chat",
    });
    expect(provider?.id).toBe("deepseek");
  });
});
