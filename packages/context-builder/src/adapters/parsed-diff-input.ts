import type {
  ChangedFile,
  FileChangeStatus,
  PullRequestData,
} from "@pr-review/shared";

import { buildReviewContext } from "../build-review-context.js";

export interface ParsedDiffFileInput {
  filename: string;
  patch: string | null;
  status?: FileChangeStatus;
  additions?: number;
  deletions?: number;
}

function toChangedFile(input: ParsedDiffFileInput): ChangedFile {
  const additions = input.additions ?? 0;
  const deletions = input.deletions ?? 0;

  return {
    filename: input.filename,
    status: input.status ?? "modified",
    additions,
    deletions,
    changes: additions + deletions,
    patch: input.patch,
    blobUrl: "",
    rawUrl: "",
  };
}

/** Builds minimal PullRequestData from diff-parser file outputs. */
export function toPullRequestData(
  files: ParsedDiffFileInput[],
  metadata?: Partial<PullRequestData["metadata"]>,
): PullRequestData {
  const changedFiles = files.map(toChangedFile);
  const additions = changedFiles.reduce((sum, file) => sum + file.additions, 0);
  const deletions = changedFiles.reduce((sum, file) => sum + file.deletions, 0);

  return {
    source: { owner: "local", repo: "diff", pullNumber: 0 },
    metadata: {
      id: metadata?.id ?? 0,
      number: metadata?.number ?? 0,
      title: metadata?.title ?? "Parsed diff input",
      body: metadata?.body ?? null,
      state: metadata?.state ?? "open",
      draft: metadata?.draft ?? false,
      merged: metadata?.merged ?? false,
      htmlUrl: metadata?.htmlUrl ?? "",
      author: metadata?.author ?? { login: "local", avatarUrl: null },
      base: metadata?.base ?? {
        ref: "main",
        sha: "",
        label: "local:main",
      },
      head: metadata?.head ?? {
        ref: "head",
        sha: "",
        label: "local:head",
      },
      createdAt: metadata?.createdAt ?? new Date().toISOString(),
      updatedAt: metadata?.updatedAt ?? new Date().toISOString(),
      mergedAt: metadata?.mergedAt ?? null,
      additions,
      deletions,
      changedFiles: changedFiles.length,
      commits: metadata?.commits ?? 0,
    },
    changedFiles,
    commits: [],
    comments: [],
    fetchedAt: new Date().toISOString(),
  };
}

export function buildReviewContextFromParsedDiffs(
  files: ParsedDiffFileInput[],
  options?: import("@pr-review/shared").BuildContextOptions,
): import("@pr-review/shared").ReviewContext {
  return buildReviewContext(toPullRequestData(files), options);
}
