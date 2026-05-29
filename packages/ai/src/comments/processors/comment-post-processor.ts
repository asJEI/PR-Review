import type { ReviewCommentItem, ReviewContext } from "@pr-review/shared";

export interface CommentProcessContext {
  reviewContext?: ReviewContext;
}

export interface CommentPostProcessor {
  readonly id: string;
  process(comments: ReviewCommentItem[], ctx: CommentProcessContext): ReviewCommentItem[];
}
