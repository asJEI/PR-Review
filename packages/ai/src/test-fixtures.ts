import type { ReviewContext } from "@pr-review/shared";
import { compressReviewContext } from "@pr-review/context-compressor";
import { scoreRelevance } from "@pr-review/context-relevance";
import { buildReviewPrompts } from "@pr-review/prompt-builder";

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
  existingDiscussion: [],
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
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: ["authentication"],
    changeProfile: { added: 0, modified: 2, removed: 0, renamed: 0, languages: { typescript: 2 } },
    symbolSummary: ["verifyToken modified"],
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
  ],
  stats: {
    fileCount: 2,
    symbolCount: 1,
    estimatedTokens: 500,
    skippedFiles: [],
    truncatedFiles: [],
  },
  builtAt: new Date().toISOString(),
};

export function createSummaryGeneratorFixture() {
  const reviewContext = REVIEW_CONTEXT_FIXTURE;
  const compressedContext = compressReviewContext(reviewContext);
  const relevanceReport = scoreRelevance({ reviewContext, compressedContext });
  const prompts = buildReviewPrompts({ compressedContext, relevanceReport, reviewContext });

  return {
    reviewContext,
    compressedContext,
    relevanceReport,
    summaryPrompt: prompts.summaryPrompt,
    input: {
      summaryPrompt: prompts.summaryPrompt,
      compressedContext,
      relevanceReport,
      reviewContext,
    },
  };
}

export function createRiskReviewFixture() {
  const reviewContext = REVIEW_CONTEXT_FIXTURE;
  const compressedContext = compressReviewContext(reviewContext);
  const relevanceReport = scoreRelevance({ reviewContext, compressedContext });
  const prompts = buildReviewPrompts({ compressedContext, relevanceReport, reviewContext });

  return {
    reviewContext,
    compressedContext,
    relevanceReport,
    riskPrompt: prompts.riskPrompt,
    input: {
      riskPrompt: prompts.riskPrompt,
      compressedContext,
      relevanceReport,
      reviewContext,
    },
  };
}
