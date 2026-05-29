import { describe, expect, it } from "vitest";

import { buildPathAliases, resolveFilePath } from "./path-resolver.js";

describe("path-resolver", () => {
  it("builds aliases from previousFilename", () => {
    const aliases = buildPathAliases([
      { filename: "src/new.ts", previousFilename: "src/old.ts" },
    ]);

    expect(aliases["src/old.ts"]).toBe("src/new.ts");
  });

  it("resolves renamed paths", () => {
    const resolved = resolveFilePath("src/old.ts", { "src/old.ts": "src/new.ts" });
    expect(resolved).toBe("src/new.ts");
  });
});
