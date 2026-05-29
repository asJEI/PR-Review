import type { ReviewContext } from "@pr-review/shared";
import { compressReviewContext } from "@pr-review/context-compressor";
import { scoreRelevance } from "@pr-review/context-relevance";

export const REVIEW_CONTEXT_FIXTURE: ReviewContext = {
  source: { owner: "acme", repo: "app", pullNumber: 1 },
  metadata: {
    number: 1,
    title: "Auth update",
    state: "open",
    author: "dev",
    baseRef: "main",
    headRef: "feature",
    additions: 20,
    deletions: 2,
    changedFiles: 3,
  },
  commitThemes: ["feat: jwt refresh"],
  existingDiscussion: [
    {
      path: "src/auth/jwt.ts",
      author: "reviewer",
      excerpt: "Consider token expiry edge cases",
      type: "review",
    },
  ],
  changeGroups: [],
  files: [
    {
      filename: "src/auth/jwt.ts",
      status: "modified",
      language: "typescript",
      additions: 10,
      deletions: 1,
      symbols: [{ name: "verifyToken", kind: "function", changeType: "modified" }],
      imports: [],
      hunks: [],
      truncated: false,
    },
    {
      filename: "src/middleware/auth.ts",
      status: "modified",
      language: "typescript",
      additions: 5,
      deletions: 0,
      symbols: [{ name: "authMiddleware", kind: "function", changeType: "modified" }],
      imports: [],
      hunks: [],
      truncated: false,
    },
    {
      filename: "vendor/react.js",
      status: "modified",
      language: "javascript",
      additions: 1,
      deletions: 0,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: false,
    },
    {
      filename: "src/utils/format.ts",
      status: "modified",
      language: "typescript",
      additions: 2,
      deletions: 1,
      symbols: [],
      imports: [],
      hunks: [],
      truncated: false,
    },
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: ["authentication"],
    changeProfile: { added: 0, modified: 4, removed: 0, renamed: 0, languages: { typescript: 3 } },
    symbolSummary: ["verifyToken modified", "authMiddleware modified"],
    commitThemes: ["feat: jwt refresh"],
    discussionHints: [],
    riskHints: ["Auth logic changed in src/auth/jwt.ts"],
  },
  modules: [
    {
      module: "src/auth",
      affectedFunctions: [{ name: "verifyToken", kind: "function", changeType: "modified" }],
      relatedFiles: ["src/auth/jwt.ts"],
      dependencies: [],
      expandedDependencies: [],
      callChainHints: [],
      riskContext: ["Auth logic changed in src/auth/jwt.ts"],
      surroundingContext: [],
      semanticSummary: "auth changes",
    },
    {
      module: "src/middleware",
      affectedFunctions: [{ name: "authMiddleware", kind: "function", changeType: "modified" }],
      relatedFiles: ["src/middleware/auth.ts"],
      dependencies: [],
      expandedDependencies: [],
      callChainHints: [],
      riskContext: ["Middleware auth handler modified"],
      surroundingContext: [],
      semanticSummary: "middleware auth",
    },
  ],
  stats: {
    fileCount: 4,
    symbolCount: 2,
    estimatedTokens: 1000,
    skippedFiles: [],
    truncatedFiles: [],
  },
  builtAt: new Date().toISOString(),
};

export function createPromptBuildFixture() {
  const reviewContext = REVIEW_CONTEXT_FIXTURE;
  const compressedContext = compressReviewContext(reviewContext);
  const relevanceReport = scoreRelevance({ reviewContext, compressedContext });

  return {
    reviewContext,
    compressedContext,
    relevanceReport,
    input: { compressedContext, relevanceReport, reviewContext },
  };
}
