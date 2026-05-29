import { describe, expect, it } from "vitest";

import { buildLogicChangesFromSymbols } from "./logic-change-templates.js";

describe("logic-change-templates", () => {
  it("builds structured logic summaries without raw code", () => {
    const summaries = buildLogicChangesFromSymbols(
      [{ name: "login", kind: "method", changeType: "modified" }],
      ["Auth logic changed"],
      [
        {
          kind: "semantic",
          label: "Auth-related symbol: login",
          weight: 15,
          category: "authLogicChanged",
        },
      ],
      ["src/auth/service.ts"],
    );

    expect(summaries[0]?.whatChanged).toContain("login");
    expect(summaries[0]?.whyItMatters).toContain("authentication");
    expect(summaries[0]?.whatChanged).not.toContain("function(");
  });
});
