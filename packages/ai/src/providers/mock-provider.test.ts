import { describe, expect, it } from "vitest";

import { MockProvider } from "./mock-provider.js";

describe("MockProvider", () => {
  it("returns deterministic JSON completion", async () => {
    const provider = new MockProvider({
      response: {
        intent: "Test intent",
        coreChanges: ["Change A"],
        affectedModules: ["src/auth"],
        infrastructureImpact: null,
      },
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "prompt" }],
      model: "test-model",
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.intent).toBe("Test intent");
    expect(result.model).toBe("test-model");
    expect(result.usage?.totalTokens).toBeGreaterThan(0);
  });
});
