import type { PRMetadata, PullRequestData } from "@pr-review/shared";

import { mapGitHubError } from "./map-github-error.js";
import {
  normalizeChangedFile,
  normalizeCommit,
  normalizeIssueComment,
  normalizeMetadata,
  normalizeReviewComment,
} from "./normalize.js";
import { paginatePullRequestList } from "./paginate.js";
import { createOctokitClient } from "./pr-client.js";
import { parsePrUrl } from "./pr-link-parser.js";
import { validatePrUrl } from "./validation.js";

export interface GetPullRequestOptions {
  /**
   * GitHub personal access token (optional for public repos).
   * Falls back to `process.env.GITHUB_TOKEN` when omitted.
   */
  token?: string;
}

/**
 * Fetches and normalizes all PR data required by downstream context-builder.
 *
 * Architecture:
 * - Single orchestration entry point (this function)
 * - Pure URL parsing + validation before any network I/O
 * - Parallel paginated list fetches after metadata confirms the PR exists
 * - Normalization layer converts Octokit shapes into `@pr-review/shared` types
 */
export async function getPullRequest(
  prUrl: string,
  options: GetPullRequestOptions = {},
): Promise<PullRequestData> {
  validatePrUrl(prUrl);

  const source = parsePrUrl(prUrl);
  const token = options.token ?? process.env["GITHUB_TOKEN"];
  const octokit = createOctokitClient({ token });

  let metadata: PRMetadata;

  try {
    const pullResponse = await octokit.rest.pulls.get({
      owner: source.owner,
      repo: source.repo,
      pull_number: source.pullNumber,
    });

    metadata = normalizeMetadata(pullResponse.data);
  } catch (error) {
    throw mapGitHubError(error, source);
  }

  const listParams = {
    owner: source.owner,
    repo: source.repo,
    pullNumber: source.pullNumber,
  };

  const [rawFiles, rawCommits, rawIssueComments, rawReviewComments] =
    await Promise.all([
      paginatePullRequestList(
        (params) => octokit.rest.pulls.listFiles(params),
        listParams,
      ),
      paginatePullRequestList(
        (params) => octokit.rest.pulls.listCommits(params),
        listParams,
      ),
      paginatePullRequestList((params) => {
        const { pull_number, ...rest } = params;
        return octokit.rest.issues.listComments({
          ...rest,
          issue_number: pull_number,
        });
      }, listParams),
      paginatePullRequestList(
        (params) => octokit.rest.pulls.listReviewComments(params),
        listParams,
      ),
    ]);

  const comments = [
    ...rawIssueComments.map(normalizeIssueComment),
    ...rawReviewComments.map(normalizeReviewComment),
  ].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return {
    source,
    metadata,
    changedFiles: rawFiles.map(normalizeChangedFile),
    commits: rawCommits.map(normalizeCommit),
    comments,
    fetchedAt: new Date().toISOString(),
  };
}
