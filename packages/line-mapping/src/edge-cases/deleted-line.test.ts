import { describe, expect, it } from "vitest";

import { mapLineToDiff } from "../symbol-diff-mapper.js";
import { LINE_MAPPING_FIXTURE } from "../test-fixtures.js";

describe("deleted-line edge cases", () => {
  it("maps deleted lines to LEFT side", () => {
    const mapping = mapLineToDiff(
      { reviewContext: LINE_MAPPING_FIXTURE },
      "src/auth/legacy.ts",
      12,
      "LEFT",
    );

    expect(mapping).not.toBeNull();
    expect(mapping!.side).toBe("LEFT");
    expect(mapping!.startLine).toBe(12);
  });
});
