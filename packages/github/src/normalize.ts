import type { Endpoints } from "@octokit/types";
import type {
  ChangedFile,
  FileChangeStatus,
  PRComment,
  PRCommit,
  PRMetadata,
} from "@pr-review/shared";

type PullResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"];
type PullFile =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"]["response"]["data"][number];
type PullCommit =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"]["response"]["data"][number];
type IssueComment =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"]["response"]["data"][number];
type ReviewComment =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"]["data"][number];

const FILE_STATUSES = new Set<FileChangeStatus>([
  "added",
  "removed",
  "modified",
  "renamed",
  "copied",
  "changed",
  "unchanged",
]);

function toFileChangeStatus(status: string): FileChangeStatus {
  if (FILE_STATUSES.has(status as FileChangeStatus)) {
    return status as FileChangeStatus;
  }

  return "changed";
}

/** Strips Octokit-specific fields; keeps only review-relevant metadata. */
export function normalizeMetadata(pull: PullResponse): PRMetadata {
  return {
    id: pull.id,
    number: pull.number,
    title: pull.title,
    body: pull.body,
    state: pull.state,
    draft: pull.draft ?? false,
    merged: pull.merged_at !== null,
    htmlUrl: pull.html_url,
    author: {
      login: pull.user?.login ?? "unknown",
      avatarUrl: pull.user?.avatar_url ?? null,
    },
    base: {
      ref: pull.base.ref,
      sha: pull.base.sha,
      label: pull.base.label,
    },
    head: {
      ref: pull.head.ref,
      sha: pull.head.sha,
      label: pull.head.label,
    },
    createdAt: pull.created_at,
    updatedAt: pull.updated_at,
    mergedAt: pull.merged_at,
    additions: pull.additions,
    deletions: pull.deletions,
    changedFiles: pull.changed_files,
    commits: pull.commits,
  };
}

export function normalizeChangedFile(file: PullFile): ChangedFile {
  const normalized: ChangedFile = {
    filename: file.filename,
    status: toFileChangeStatus(file.status),
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch ?? null,
    blobUrl: file.blob_url,
    rawUrl: file.raw_url,
  };

  if (file.previous_filename) {
    normalized.previousFilename = file.previous_filename;
  }

  return normalized;
}

export function normalizeCommit(commit: PullCommit): PRCommit {
  const gitAuthor = commit.commit.author;
  const gitCommitter = commit.commit.committer;

  return {
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: gitAuthor?.name ?? gitCommitter?.name ?? null,
      email: gitAuthor?.email ?? gitCommitter?.email ?? null,
      login: commit.author?.login ?? null,
      date: gitAuthor?.date ?? gitCommitter?.date ?? null,
    },
    htmlUrl: commit.html_url,
  };
}

export function normalizeIssueComment(comment: IssueComment): PRComment {
  return {
    id: comment.id,
    type: "issue",
    body: comment.body ?? "",
    author: {
      login: comment.user?.login ?? "unknown",
      avatarUrl: comment.user?.avatar_url ?? null,
    },
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    htmlUrl: comment.html_url,
  };
}

export function normalizeReviewComment(comment: ReviewComment): PRComment {
  return {
    id: comment.id,
    type: "review",
    body: comment.body,
    author: {
      login: comment.user?.login ?? "unknown",
      avatarUrl: comment.user?.avatar_url ?? null,
    },
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    htmlUrl: comment.html_url,
    path: comment.path,
    line: comment.line,
    side: comment.side,
    commitId: comment.commit_id,
    inReplyToId: comment.in_reply_to_id,
  };
}
