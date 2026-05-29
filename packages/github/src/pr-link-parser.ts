import type { ParsedPrUrl } from "@pr-review/shared";

import { GitHubUrlParseError } from "./errors.js";

/**
 * Matches standard GitHub PR URLs, including optional scheme/www and trailing tab paths.
 * Examples:
 * - https://github.com/owner/repo/pull/42
 * - github.com/owner/repo/pull/42/files
 */
const PR_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/i;

/**
 * Pure URL parser — no I/O, no validation beyond structural match.
 * Call `validatePrUrl` first for user input checks.
 */
export function parsePrUrl(prUrl: string): ParsedPrUrl {
  const trimmed = prUrl.trim();
  const match = PR_URL_PATTERN.exec(trimmed);

  if (!match) {
    throw new GitHubUrlParseError(trimmed);
  }

  const owner = match[1];
  const repo = match[2];
  const pullNumberRaw = match[3];

  if (!owner || !repo || !pullNumberRaw) {
    throw new GitHubUrlParseError(trimmed);
  }

  const pullNumber = Number.parseInt(pullNumberRaw, 10);

  if (!Number.isFinite(pullNumber) || pullNumber < 1) {
    throw new GitHubUrlParseError(
      trimmed,
      "Pull request number must be positive.",
    );
  }

  return {
    owner,
    repo: repo.replace(/\.git$/i, ""),
    pullNumber,
  };
}
