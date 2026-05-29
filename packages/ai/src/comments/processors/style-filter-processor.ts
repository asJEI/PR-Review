import type { ReviewCommentItem } from "@pr-review/shared";

import type { CommentPostProcessor, CommentProcessContext } from "./comment-post-processor.js";

const STYLE_PATTERNS = [
  /naming convention/i,
  /code style/i,
  /formatting/i,
  /lint/i,
  /variable name/i,
  /indentation/i,
];

export class StyleFilterProcessor implements CommentPostProcessor {
  readonly id = "style-filter";

  process(comments: ReviewCommentItem[], _ctx?: CommentProcessContext): ReviewCommentItem[] {
    return comments.filter((comment) => {
      const text = `${comment.comment} ${comment.suggestion}`;
      return !STYLE_PATTERNS.some((pattern) => pattern.test(text));
    });
  }
}

export class DedupeProcessor implements CommentPostProcessor {
  readonly id = "dedupe";

  process(comments: ReviewCommentItem[], _ctx?: CommentProcessContext): ReviewCommentItem[] {
    const seen = new Map<string, ReviewCommentItem>();

    for (const comment of comments) {
      const key = `${comment.file}|${comment.symbol ?? ""}|${comment.comment.slice(0, 40)}`;
      seen.set(key, comment);
    }

    return [...seen.values()];
  }
}

export class DiscussionDedupeProcessor implements CommentPostProcessor {
  readonly id = "discussion-dedupe";

  process(comments: ReviewCommentItem[], ctx: CommentProcessContext): ReviewCommentItem[] {
    const excerpts =
      ctx.reviewContext?.existingDiscussion.map((item) => item.excerpt.toLowerCase()) ?? [];

    if (excerpts.length === 0) {
      return comments;
    }

    return comments.filter((comment) => {
      const lower = comment.comment.toLowerCase();
      return !excerpts.some(
        (excerpt) => excerpt.length > 10 && (lower.includes(excerpt) || excerpt.includes(lower)),
      );
    });
  }
}
