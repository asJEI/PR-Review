import type {
  RawReviewCommentResponse,
  RawRiskAgentResponse,
  RawSummaryAgentResponse,
} from "@pr-review/shared";

export const DEFAULT_RISK_MOCK_RESPONSE: RawRiskAgentResponse = {
  risks: [
    {
      category: "authentication",
      location: "src/auth/jwt.ts::verifyToken",
      severity: "high",
      rationale: "JWT verification logic modified; token refresh path may affect session validity",
      mitigation: "Verify token expiry edge cases and add regression tests for refresh flow",
      confidence: "high",
    },
    {
      category: "auth",
      location: "src/middleware/auth.ts::authMiddleware",
      severity: "medium",
      rationale: "Middleware auth handler modified; request gating may change",
      mitigation: "Confirm unauthorized requests are still rejected before route handlers",
      confidence: "medium",
    },
  ],
  overallRiskLevel: "high",
};

export const DEFAULT_REVIEW_MOCK_RESPONSE: RawReviewCommentResponse = {
  comments: [
    {
      file: "src/auth/jwt.ts",
      symbol: "verifyToken",
      lineHint: "42",
      severity: "major",
      body: "JWT refresh handling changes token validation flow; verify expiry edge cases are covered.",
      suggestions: [
        "Add regression tests for expired and near-expiry tokens during refresh",
      ],
      confidence: "high",
    },
    {
      file: "src/middleware/auth.ts",
      symbol: "authMiddleware",
      lineHint: null,
      severity: "minor",
      body: "Auth middleware gating changed; confirm unauthorized requests fail before route handlers.",
      suggestions: ["Add integration test for 401 on protected routes without token"],
      confidence: "medium",
    },
  ],
};

export const DEFAULT_MOCK_RESPONSE: RawSummaryAgentResponse = {
  intent: "Updates JWT verification and auth middleware for token refresh support.",
  coreChanges: [
    "Modified verifyToken in src/auth/jwt.ts for refresh handling",
    "Updated authMiddleware in src/middleware/auth.ts",
  ],
  affectedModules: ["src/auth", "src/middleware"],
  infrastructureImpact: "Authentication flow changes may affect session handling",
  notableRisks: ["Auth logic changed in src/auth/jwt.ts"],
};
