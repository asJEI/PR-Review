import { describe, expect, it } from "vitest";

import { buildCoreChange } from "./core-change-templates.js";
import type { EngineeringModuleContext } from "@pr-review/shared";

const BASE_MODULE: EngineeringModuleContext = {
  module: "src/auth",
  affectedFunctions: [
    { name: "login", kind: "method", changeType: "modified" },
  ],
  relatedFiles: ["src/auth/service.ts"],
  dependencies: [],
  expandedDependencies: [],
  callChainHints: [],
  riskContext: ["Auth logic changed in src/auth/service.ts"],
  surroundingContext: [],
  semanticSummary: "auth changes",
};

describe("core-change-templates", () => {
  it("prefers matched commit theme", () => {
    const coreChange = buildCoreChange(
      BASE_MODULE,
      [],
      [],
      "JWT refresh flow refactor",
    );

    expect(coreChange).toBe("JWT refresh flow refactor");
  });

  it("falls back to risk-driven intent", () => {
    const coreChange = buildCoreChange(
      BASE_MODULE,
      [
        {
          kind: "risk",
          label: "Auth logic changed",
          weight: 20,
          category: "authLogicChanged",
        },
      ],
      [],
      null,
    );

    expect(coreChange).toBe("Authentication/authorization logic update");
  });
});
