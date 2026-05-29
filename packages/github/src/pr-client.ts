import { Octokit } from "@octokit/rest";

export interface CreateOctokitOptions {
  /** Personal access token; increases rate limits for public repo access. */
  token?: string;
}

const USER_AGENT = "pr-review-github-fetcher/0.1.0";

/**
 * Factory for Octokit clients.
 * Auth is optional for public repositories (MVP scope).
 */
export function createOctokitClient(
  options: CreateOctokitOptions = {},
): Octokit {
  return new Octokit({
    auth: options.token,
    userAgent: USER_AGENT,
  });
}
