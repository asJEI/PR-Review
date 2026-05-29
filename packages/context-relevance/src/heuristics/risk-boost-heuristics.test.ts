import { describe, expect, it } from "vitest";

import { hasAuthAndDbRisk, scoreRiskHints } from "./risk-boost-heuristics.js";

describe("risk-boost-heuristics", () => {
  it("maps risk hints to boosts and reasons", () => {
    const boosts = scoreRiskHints([
      "Auth logic changed in src/auth/service.ts",
      "Database-related change detected in src/db/repo.ts",
    ]);

    expect(boosts.some((boost) => boost.category === "authLogicChanged")).toBe(true);
    expect(boosts.some((boost) => boost.category === "databaseOperationModified")).toBe(true);
    expect(hasAuthAndDbRisk(boosts)).toBe(true);
  });
});
