import { describe, expect, it } from "vitest";

import { createSection, prioritizeSections } from "./section-prioritizer.js";

describe("section-prioritizer", () => {
  it("orders critical sections before low-priority sections", () => {
    const sections = [
      createSection("low", "## Low", "vendor file", "review", 10),
      createSection("critical", "## Critical", "auth handler", "review", 90),
      createSection("medium", "## Medium", "utility", "review", 40),
    ];

    const ordered = prioritizeSections(sections);
    expect(ordered[0]!.id).toBe("critical");
    expect(ordered[1]!.id).toBe("medium");
    expect(ordered[2]!.id).toBe("low");
  });
});
