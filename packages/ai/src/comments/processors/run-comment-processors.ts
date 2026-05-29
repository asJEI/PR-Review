import {
  DedupeProcessor,
  DiscussionDedupeProcessor,
  StyleFilterProcessor,
} from "./style-filter-processor.js";
import type { CommentPostProcessor, CommentProcessContext } from "./comment-post-processor.js";

export function createDefaultCommentProcessors(): CommentPostProcessor[] {
  return [new StyleFilterProcessor(), new DedupeProcessor(), new DiscussionDedupeProcessor()];
}

export function runCommentProcessors(
  processors: CommentPostProcessor[],
  ...args: Parameters<CommentPostProcessor["process"]>
): ReturnType<CommentPostProcessor["process"]> {
  let comments = args[0];
  const ctx = args[1];

  for (const processor of processors) {
    comments = processor.process(comments, ctx);
  }

  return comments;
}
