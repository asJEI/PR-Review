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
  existingDiscussion: [],
  changeGroups: [],
  files: [
    {
      filename: "src/auth/jwt.ts",
      status: "modified",
      language: "typescript",
      additions: 10,
      deletions: 1,
      symbols: [{ name: "verifyToken", kind: "function", changeType: "modified", line: 42 }],
      imports: [],
      hunks: [
        {
          oldStart: 38,
          oldLines: 8,
          newStart: 38,
          newLines: 10,
          header: "@@ -38,8 +38,10 @@ export function verifyToken",
          contextLines: [
            {
              type: "context",
              content: " import jwt from 'jsonwebtoken';",
              oldLineNumber: 40,
              newLineNumber: 40,
            },
          ],
          changeLines: [
            {
              type: "delete",
              content: "-  return jwt.verify(token, secret);",
              oldLineNumber: 41,
              newLineNumber: null,
            },
            {
              type: "add",
              content: "+  return jwt.verify(token, secret, { maxAge: '1h' });",
              oldLineNumber: null,
              newLineNumber: 42,
            },
          ],
        },
      ],
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
      hunks: [
        {
          oldStart: 1,
          oldLines: 1,
          newStart: 1,
          newLines: 2,
          header: "@@ -1 +1,2 @@",
          contextLines: [],
          changeLines: [
            {
              type: "add",
              content: "+console.log('vendor');",
              oldLineNumber: null,
              newLineNumber: 1,
            },
          ],
        },
      ],
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
      hunks: [
        {
          oldStart: 1,
          oldLines: 2,
          newStart: 1,
          newLines: 2,
          header: "@@ -1,2 +1,2 @@",
          contextLines: [],
          changeLines: [
            {
              type: "delete",
              content: "-   ",
              oldLineNumber: 2,
              newLineNumber: null,
            },
            {
              type: "add",
              content: "+    ",
              oldLineNumber: null,
              newLineNumber: 2,
            },
          ],
        },
      ],
      truncated: false,
    },
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: ["authentication"],
    changeProfile: { added: 0, modified: 3, removed: 0, renamed: 0, languages: { typescript: 2 } },
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
    fileCount: 3,
    symbolCount: 1,
    estimatedTokens: 500,
    skippedFiles: [],
    truncatedFiles: [],
  },
  builtAt: new Date().toISOString(),
};

export function createFocusedDiffFixture() {
  const reviewContext = REVIEW_CONTEXT_FIXTURE;
  const compressedContext = compressReviewContext(reviewContext);
  const relevanceReport = scoreRelevance({ reviewContext, compressedContext });

  return { reviewContext, compressedContext, relevanceReport };
}
