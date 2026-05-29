import { RequestError } from "@octokit/request-error";
import type { ParsedPrUrl } from "@pr-review/shared";

import {
  GitHubApiError,
  GitHubFetcherError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "./errors.js";

function parseRateLimitHeader(
  headers: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = headers?.[key];

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseResetHeader(
  headers: Record<string, unknown> | undefined,
): Date | null {
  const reset = parseRateLimitHeader(headers, "x-ratelimit-reset");

  if (reset === null) {
    return null;
  }

  return new Date(reset * 1000);
}

function isRateLimited(error: RequestError): boolean {
  const remaining = parseRateLimitHeader(
    error.response?.headers as Record<string, unknown> | undefined,
    "x-ratelimit-remaining",
  );

  if (remaining === 0) {
    return true;
  }

  const message = error.message.toLowerCase();
  return error.status === 403 && message.includes("rate limit");
}

/**
 * Maps Octokit RequestError into domain errors consumed by apps/server.
 */
export function mapGitHubError(
  error: unknown,
  source?: Pick<ParsedPrUrl, "owner" | "repo" | "pullNumber">,
): GitHubFetcherError {
  if (error instanceof GitHubFetcherError) {
    return error;
  }

  if (error instanceof RequestError) {
    const headers = error.response?.headers as
      | Record<string, unknown>
      | undefined;

    if (isRateLimited(error)) {
      return new GitHubRateLimitError({
        resetAt: parseResetHeader(headers),
        limit: parseRateLimitHeader(headers, "x-ratelimit-limit"),
        remaining: parseRateLimitHeader(headers, "x-ratelimit-remaining"),
      });
    }

    if (error.status === 404 && source) {
      return new GitHubNotFoundError(
        {
          owner: source.owner,
          repo: source.repo,
          pullNumber: source.pullNumber,
        },
        "Pull request",
      );
    }

    return new GitHubApiError(error.status, error.message, { cause: error });
  }

  if (error instanceof Error) {
    return new GitHubApiError(500, error.message, { cause: error });
  }

  return new GitHubApiError(500, "Unknown GitHub API error.");
}
