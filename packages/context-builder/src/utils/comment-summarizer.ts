import type { DiscussionSummary, PRComment } from "@pr-review/shared";

import { firstLine, truncateText } from "./truncate.js";

const MAX_EXCERPT = 120;

export function summarizeComments(comments: PRComment[]): DiscussionSummary[] {
  return comments.map((comment) => ({
    path: comment.path ?? null,
    author: comment.author.login,
    excerpt: truncateText(firstLine(comment.body), MAX_EXCERPT),
    type: comment.type,
  }));
}
