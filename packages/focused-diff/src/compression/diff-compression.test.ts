import { describe, expect, it } from "vitest";

import { compressSnippet } from "./diff-compression.js";
import { formatFocusedDiff } from "./snippet-formatter.js";
import type { MappedSnippet } from "../mapping/symbol-context-mapper.js";

const BASE_SNIPPET: MappedSnippet = {
  file: "src/auth/jwt.ts",
  symbol: "verifyToken",
  hunkIndex: 0,
  relevance: 0.9,
  riskSignals: ["auth"],
  changeLines: [
    {
      type: "add",
      content: "+  return jwt.verify(token, secret);",
      oldLineNumber: null,
      newLineNumber: 42,
    },
  ],
  contextLines: [
    {
      type: "context",
      content: " import jwt from 'jsonwebtoken';",
      oldLineNumber: 40,
      newLineNumber: 40,
    },
  ],
  lineRange: { start: 42, end: 42 },
};

describe("diff-compression", () => {
  it("formats pseudo-diff without @@ headers", () => {
    const focused = formatFocusedDiff(
      BASE_SNIPPET.file,
      BASE_SNIPPET.symbol,
      BASE_SNIPPET.changeLines,
    );
    expect(focused).toContain("// src/auth/jwt.ts :: verifyToken");
    expect(focused).toContain("return jwt.verify(token, secret)");
    expect(focused).not.toContain("@@");
    expect(focused).not.toContain("diff --git");
  });

  it("uses context lines for normal compression", () => {
    const compressed = compressSnippet(BASE_SNIPPET, "normal");
    expect(compressed.surroundingContext).toContain("jsonwebtoken");
    expect(compressed.estimatedTokens).toBeGreaterThan(0);
  });

  it("uses summary for aggressive compression", () => {
    const compressed = compressSnippet(BASE_SNIPPET, "aggressive");
    expect(compressed.surroundingContext).toContain("additions");
    expect(compressed.surroundingContext).toContain("verifyToken");
  });
});
