/**
 * Normalized PR domain types consumed by github, context-builder, and ai packages.
 * Kept free of Octokit/GitHub SDK shapes so downstream modules stay decoupled from API details.
 */

/** Result of parsing a GitHub pull request URL. */
export interface ParsedPrUrl {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface BranchRef {
  ref: string;
  sha: string;
  label: string;
}

export interface PRAuthor {
  login: string;
  avatarUrl: string | null;
}

/** High-level PR metadata normalized for review workflows. */
export interface PRMetadata {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  htmlUrl: string;
  author: PRAuthor;
  base: BranchRef;
  head: BranchRef;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: number;
}

export type FileChangeStatus =
  | "added"
  | "removed"
  | "modified"
  | "renamed"
  | "copied"
  | "changed"
  | "unchanged";

/**
 * A single changed file with optional unified diff patch.
 * `patch` is null when GitHub omits it (large/binary files).
 */
export interface ChangedFile {
  filename: string;
  status: FileChangeStatus;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
  previousFilename?: string;
  blobUrl: string;
  rawUrl: string;
}

export interface PRCommitAuthor {
  name: string | null;
  email: string | null;
  login: string | null;
  date: string | null;
}

export interface PRCommit {
  sha: string;
  message: string;
  author: PRCommitAuthor;
  htmlUrl: string;
}

export type CommentType = "issue" | "review";

export interface PRCommentAuthor {
  login: string;
  avatarUrl: string | null;
}

/**
 * Unified comment shape for issue-level and inline review comments.
 * Review-only fields are optional on issue comments.
 */
export interface PRComment {
  id: number;
  type: CommentType;
  body: string;
  author: PRCommentAuthor;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  path?: string;
  line?: number | null;
  side?: "LEFT" | "RIGHT" | null;
  commitId?: string;
  inReplyToId?: number | null;
}

/**
 * Complete normalized payload returned by the GitHub fetcher layer.
 * Designed as the single input contract for context-builder.
 */
export interface PullRequestData {
  source: ParsedPrUrl;
  metadata: PRMetadata;
  changedFiles: ChangedFile[];
  commits: PRCommit[];
  comments: PRComment[];
  fetchedAt: string;
}
