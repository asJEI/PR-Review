import type { PRCommit } from "@pr-review/shared";

import { firstLine } from "./truncate.js";

/** Extracts deduplicated first-line commit themes for intent hints. */
export function extractCommitThemes(commits: PRCommit[]): string[] {
  const seen = new Set<string>();
  const themes: string[] = [];

  for (const commit of commits) {
    const theme = firstLine(commit.message);

    if (theme.length === 0 || seen.has(theme)) {
      continue;
    }

    seen.add(theme);
    themes.push(theme);
  }

  return themes;
}
