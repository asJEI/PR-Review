import { describe, expect, it } from "vitest";

import { mapSymbolToDiff } from "../symbol-diff-mapper.js";
import { LINE_MAPPING_FIXTURE } from "../test-fixtures.js";

describe("truncated-file edge cases", () => {
  it("downgrades confidence and skips position for truncated files", () => {
    const mapping = mapSymbolToDiff(
      { reviewContext: LINE_MAPPING_FIXTURE },
      "src/auth/legacy.ts",
      "oldAuth",
    );

    expect(mapping).not.toBeNull();
    expect(mapping!.truncated).toBe(true);
    expect(mapping!.githubPosition).toBeUndefined();
    expect(mapping!.confidence).not.toBe("exact");
  });

  it("marks truncated flag on file index entries", () => {
    const file = LINE_MAPPING_FIXTURE.files.find((entry) => entry.filename === "src/auth/legacy.ts");
    expect(file?.truncated).toBe(true);
  });
});
