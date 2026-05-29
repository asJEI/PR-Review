import type { DiscussionSummary } from "@pr-review/shared";

export function formatExistingDiscussion(discussion: DiscussionSummary[]): string {
  if (discussion.length === 0) {
    return "No existing review discussion to avoid duplicating.";
  }

  const lines = ["Existing discussion (avoid repeating these points):"];
  for (const item of discussion.slice(0, 8)) {
    const location = item.path ? `${item.path}` : "general";
    lines.push(`- [${item.type}] ${item.author} on ${location}: ${item.excerpt}`);
  }

  return lines.join("\n");
}
