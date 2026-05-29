import type { ReviewContext } from "@pr-review/shared";

export const LINE_MAPPING_FIXTURE: ReviewContext = {
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
    changedFiles: 2,
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
      symbols: [
        { name: "refreshToken", kind: "function", changeType: "modified", line: 85 },
        { name: "verifyToken", kind: "function", changeType: "modified", line: 39 },
      ],
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
              newLineNumber: 39,
            },
          ],
        },
        {
          oldStart: 84,
          oldLines: 40,
          newStart: 84,
          newLines: 42,
          header: "@@ -84,40 +84,42 @@ export function refreshToken",
          contextLines: [
            {
              type: "context",
              content: " export function refreshToken(token: string) {",
              oldLineNumber: 90,
              newLineNumber: 90,
            },
          ],
          changeLines: [
            {
              type: "add",
              content: "+  const expiry = parseExpiry(token);",
              oldLineNumber: null,
              newLineNumber: 85,
            },
            {
              type: "add",
              content: "+  if (!expiry) throw new Error('invalid');",
              oldLineNumber: null,
              newLineNumber: 86,
            },
            {
              type: "add",
              content: "+  return signRefresh(token, expiry);",
              oldLineNumber: null,
              newLineNumber: 87,
            },
          ],
        },
      ],
      truncated: false,
    },
    {
      filename: "src/auth/legacy.ts",
      status: "removed",
      language: "typescript",
      additions: 0,
      deletions: 5,
      symbols: [],
      imports: [],
      hunks: [
        {
          oldStart: 10,
          oldLines: 3,
          newStart: 10,
          newLines: 0,
          header: "@@ -10,3 +10,0 @@",
          contextLines: [],
          changeLines: [
            {
              type: "delete",
              content: "-export function oldAuth() {}",
              oldLineNumber: 12,
              newLineNumber: null,
            },
          ],
        },
      ],
      truncated: true,
    },
  ],
  dependencyGraph: { nodes: [], edges: [] },
  semanticSummary: {
    primaryAreas: ["authentication"],
    changeProfile: { added: 0, modified: 2, removed: 0, renamed: 0, languages: { typescript: 2 } },
    symbolSummary: ["refreshToken modified"],
    commitThemes: ["feat: jwt refresh"],
    discussionHints: [],
    riskHints: ["Auth logic changed in src/auth/jwt.ts"],
  },
  modules: [],
  stats: {
    fileCount: 2,
    symbolCount: 2,
    estimatedTokens: 500,
    skippedFiles: [],
    truncatedFiles: ["src/auth/legacy.ts"],
  },
  builtAt: new Date().toISOString(),
};

export const JWT_PATCH = `@@ -38,8 +38,10 @@ export function verifyToken
 import jwt from 'jsonwebtoken';
-  return jwt.verify(token, secret);
+  return jwt.verify(token, secret, { maxAge: '1h' });
@@ -84,40 +84,42 @@ export function refreshToken
 export function refreshToken(token: string) {
+  const expiry = parseExpiry(token);
+  if (!expiry) throw new Error('invalid');
+  return signRefresh(token, expiry);
}`;

export function createLineMappingInput() {
  return {
    reviewContext: LINE_MAPPING_FIXTURE,
    patchesByFile: {
      "src/auth/jwt.ts": JWT_PATCH,
    },
    pathAliases: {
      "src/auth/old-jwt.ts": "src/auth/jwt.ts",
    },
  };
}
