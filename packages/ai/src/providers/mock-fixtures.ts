import type { RawRiskAgentResponse, RawSummaryAgentResponse } from "@pr-review/shared";

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
