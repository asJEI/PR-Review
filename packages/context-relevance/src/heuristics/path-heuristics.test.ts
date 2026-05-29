import { describe, expect, it } from "vitest";

import { sumPathBoost } from "./path-heuristics.js";

describe("path-heuristics", () => {
  it("boosts auth and db paths", () => {
    const auth = sumPathBoost("src/auth/jwt.ts");
    const db = sumPathBoost("src/db/repository.ts");

    expect(auth.boost).toBeGreaterThanOrEqual(0.25);
    expect(db.boost).toBeGreaterThanOrEqual(0.2);
  });

  it("boosts middleware and api paths", () => {
    const middleware = sumPathBoost("src/middleware/auth.ts");
    expect(middleware.reasons.some((reason) => reason.includes("middleware"))).toBe(true);
  });
});
