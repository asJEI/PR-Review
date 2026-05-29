import { GitHubValidationError } from "./errors.js";

const MAX_PR_URL_LENGTH = 2048;

/**
 * Validates user-provided PR URL before network calls.
 * Keeps validation separate from parsing so parsing stays a pure function.
 */
export function validatePrUrl(prUrl: unknown): asserts prUrl is string {
  if (typeof prUrl !== "string") {
    throw new GitHubValidationError("PR URL must be a string.");
  }

  const trimmed = prUrl.trim();

  if (trimmed.length === 0) {
    throw new GitHubValidationError("PR URL cannot be empty.");
  }

  if (trimmed.length > MAX_PR_URL_LENGTH) {
    throw new GitHubValidationError(
      `PR URL exceeds maximum length of ${MAX_PR_URL_LENGTH} characters.`,
    );
  }

  if (!trimmed.toLowerCase().includes("github.com")) {
    throw new GitHubValidationError(
      "PR URL must point to github.com (public repositories only in MVP).",
    );
  }
}
