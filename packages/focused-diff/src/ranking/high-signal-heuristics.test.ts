import { describe, expect, it } from "vitest";

import {
  aggregateHighSignalBoost,
  scoreHighSignalText,
} from "./high-signal-heuristics.js";

describe("high-signal-heuristics", () => {
  it("matches auth and middleware patterns", () => {
    const matches = scoreHighSignalText("jwt verifyToken middleware auth");
    expect(matches.some((match) => match.signal === "auth")).toBe(true);
    expect(matches.some((match) => match.signal === "middleware")).toBe(true);
  });

  it("matches async and database patterns", () => {
    const matches = scoreHighSignalText("await db.insert migration");
    expect(matches.some((match) => match.signal === "async")).toBe(true);
    expect(matches.some((match) => match.signal === "database")).toBe(true);
  });

  it("aggregates boost values", () => {
    const matches = scoreHighSignalText("redis cache export function");
    expect(aggregateHighSignalBoost(matches)).toBeGreaterThan(0.15);
  });
});
