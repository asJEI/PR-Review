import type { Octokit } from "@octokit/rest";

import { mapGitHubError } from "./map-github-error.js";

type PaginatedEndpoint<T> = (params: {
  owner: string;
  repo: string;
  pull_number: number;
  per_page: number;
  page: number;
}) => Promise<{ data: T[] }>;

const PER_PAGE = 100;

/**
 * Fetches all pages for list endpoints (files, commits, comments).
 * Centralizes pagination so the orchestrator stays readable.
 */
export async function paginatePullRequestList<T>(
  endpoint: PaginatedEndpoint<T>,
  params: { owner: string; repo: string; pullNumber: number },
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await endpoint({
        owner: params.owner,
        repo: params.repo,
        pull_number: params.pullNumber,
        per_page: PER_PAGE,
        page,
      });

      const batch = response.data;
      results.push(...batch);

      if (batch.length < PER_PAGE) {
        break;
      }

      page += 1;
    } catch (error) {
      throw mapGitHubError(error, params);
    }
  }

  return results;
}

export type { Octokit };
