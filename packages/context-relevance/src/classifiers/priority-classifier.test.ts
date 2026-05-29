import { describe, expect, it } from "vitest";

import { classifyPriority } from "./priority-classifier.js";

describe("priority-classifier", () => {
  it("maps scores to priority bands", () => {
    expect(classifyPriority(0.9, false)).toBe("critical");
    expect(classifyPriority(0.7, false)).toBe("high");
    expect(classifyPriority(0.5, false)).toBe("medium");
    expect(classifyPriority(0.2, false)).toBe("low");
    expect(classifyPriority(0.5, true)).toBe("ignored");
  });
});
