import type { ContextMetadata } from "@pr-review/shared";

export function formatMetadata(metadata: ContextMetadata): string {
  return [
    `- PR #${metadata.number}: ${metadata.title}`,
    `- Author: ${metadata.author}`,
    `- State: ${metadata.state}`,
    `- Branch: ${metadata.headRef} → ${metadata.baseRef}`,
    `- Stats: +${metadata.additions} / -${metadata.deletions} across ${metadata.changedFiles} files`,
  ].join("\n");
}
