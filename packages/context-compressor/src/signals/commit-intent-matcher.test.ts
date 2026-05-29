import { describe, expect, it } from "vitest";

import { matchCommitTheme } from "./commit-intent-matcher.js";

describe("commit-intent-matcher", () => {
  it("matches commit themes to module files", () => {
    const theme = matchCommitTheme(
      [
        "修复tool插件LLM KEY配置报错",
        "针对google_gemini_bot.py优化代码结构",
      ],
      ["plugins/tool/tool.py"],
    );

    expect(theme).not.toBeNull();
    expect(theme ?? "").toContain("tool");
  });

  it("returns null when no overlap exists", () => {
    expect(
      matchCommitTheme(["unrelated change"], ["src/auth/service.ts"]),
    ).toBeNull();
  });
});
