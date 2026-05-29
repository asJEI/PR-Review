import { describe, expect, it } from "vitest";

import { extractJson } from "./extract-json.js";
import { SummaryParseError } from "./errors.js";

describe("extractJson", () => {
  it("parses fenced JSON blocks", () => {
    const result = extractJson('Here is output:\n```json\n{"intent":"test"}\n```');
    expect(result).toEqual({ intent: "test" });
  });

  it("parses raw JSON objects", () => {
    const result = extractJson('{"intent":"raw","coreChanges":[]}');
    expect(result).toEqual({ intent: "raw", coreChanges: [] });
  });

  it("throws on malformed input", () => {
    expect(() => extractJson("not json")).toThrow(SummaryParseError);
  });
});
