import type { PullRequestData } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { buildReviewContext } from "./build-review-context.js";

const FIXTURE: PullRequestData = {
  source: { owner: "acme", repo: "app", pullNumber: 1 },
  metadata: {
    id: 1,
    number: 1,
    title: "Add auth",
    body: null,
    state: "open",
    draft: false,
    merged: false,
    htmlUrl: "https://github.com/acme/app/pull/1",
    author: { login: "dev", avatarUrl: null },
    base: { ref: "main", sha: "aaa", label: "acme:main" },
    head: { ref: "feature", sha: "bbb", label: "acme:feature" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    mergedAt: null,
    additions: 10,
    deletions: 2,
    changedFiles: 2,
    commits: 1,
  },
  changedFiles: [
    {
      filename: "src/auth/service.ts",
      status: "added",
      additions: 8,
      deletions: 0,
      changes: 8,
      patch: `@@ -0,0 +1,5 @@
+import { hash } from './hash';
+export class AuthService {
+  login() {}
+}
`,
      blobUrl: "",
      rawUrl: "",
    },
    {
      filename: "src/auth/hash.ts",
      status: "added",
      additions: 3,
      deletions: 0,
      changes: 3,
      patch: `@@ -0,0 +1,2 @@
+export function hash() {}
`,
      blobUrl: "",
      rawUrl: "",
    },
  ],
  commits: [
    {
      sha: "abc",
      message: "feat: add auth module",
      author: { name: "Dev", email: null, login: "dev", date: null },
      htmlUrl: "",
    },
  ],
  comments: [],
  fetchedAt: "2026-01-01T00:00:00Z",
};

describe("buildReviewContext", () => {
  it("builds end-to-end review context", () => {
    const context = buildReviewContext(FIXTURE, {
      maxEstimatedTokens: 12_000,
    });

    expect(context.files).toHaveLength(2);
    expect(context.semanticSummary.commitThemes).toContain("feat: add auth module");
    expect(context.changeGroups.length).toBeGreaterThan(0);
    expect(context.stats.symbolCount).toBeGreaterThan(0);
    expect(context.dependencyGraph.edges.some((e) => e.edgeType === "internal")).toBe(
      true,
    );
    expect(context.modules.length).toBeGreaterThan(0);
    expect(context.modules[0]?.relatedFiles.length).toBeGreaterThan(0);
  });

  it("compresses when token budget is very low", () => {
    const full = buildReviewContext(FIXTURE, { maxEstimatedTokens: 12_000 });
    const compressed = buildReviewContext(FIXTURE, {
      maxEstimatedTokens: 50,
      maxContextLinesPerHunk: 1,
    });

    expect(compressed.stats.estimatedTokens).toBeLessThan(
      full.stats.estimatedTokens,
    );
    expect(compressed.files.some((f) => f.truncated)).toBe(true);
  });
});
