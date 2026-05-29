import { describe, expect, it } from "vitest";

import { sumSymbolBoost } from "./symbol-heuristics.js";

describe("symbol-heuristics", () => {
  it("prioritizes handlers and db writes", () => {
    const handler = sumSymbolBoost({
      name: "handleRequest",
      kind: "method",
      changeType: "modified",
    });
    const util = sumSymbolBoost({
      name: "_formatDate",
      kind: "function",
      changeType: "modified",
    });

    expect(handler.boost).toBeGreaterThan(util.boost);
    expect(handler.reasons.some((reason) => reason.includes("handler"))).toBe(true);
  });
});
