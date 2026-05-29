import type { GitHubReviewCommentPayload, SymbolDiffMapping } from "@pr-review/shared";

export interface FormatGitHubReviewOptions {
  commitId?: string;
  path?: string;
  multiLine?: {
    startLine: number;
    startSide: "LEFT" | "RIGHT";
  };
}

export function formatGitHubReviewComment(
  mapping: SymbolDiffMapping | null,
  body: string,
  opts?: FormatGitHubReviewOptions,
): GitHubReviewCommentPayload {
  const trimmedBody = body.trim();
  const path = mapping?.file ?? opts?.path ?? "";

  if (!mapping || (mapping.confidence === "inferred" && mapping.changedLines.length === 0)) {
    return {
      path,
      body: path ? `[File-level review] ${trimmedBody}` : trimmedBody,
      commit_id: opts?.commitId,
    };
  }

  const payload: GitHubReviewCommentPayload = {
    path: mapping.file,
    line: mapping.startLine,
    side: mapping.side,
    body: trimmedBody,
    commit_id: opts?.commitId,
  };

  if (mapping.githubPosition !== undefined) {
    payload.position = mapping.githubPosition;
  }

  if (opts?.multiLine && opts.multiLine.startLine !== mapping.startLine) {
    payload.start_line = opts.multiLine.startLine;
    payload.start_side = opts.multiLine.startSide;
  } else if (mapping.endLine > mapping.startLine) {
    payload.start_line = mapping.startLine;
    payload.start_side = mapping.side;
    payload.line = mapping.endLine;
  }

  return payload;
}

export function formatGitHubReviewComments(
  comments: Array<{ mapping?: SymbolDiffMapping | null; body: string; file: string }>,
  opts?: FormatGitHubReviewOptions,
): GitHubReviewCommentPayload[] {
  return comments
    .map((comment) =>
      formatGitHubReviewComment(
        comment.mapping ?? null,
        comment.body,
        opts,
      ),
    )
    .filter((payload) => payload.path.length > 0 && payload.body.length > 0);
}
