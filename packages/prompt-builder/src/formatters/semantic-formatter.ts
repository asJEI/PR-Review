import type { CompressedReviewContext, SemanticSummary } from "@pr-review/shared";

export function formatSemanticOverview(
  compressed: CompressedReviewContext,
  semantic: SemanticSummary | null,
): string {
  const lines: string[] = [];

  const themes = semantic?.commitThemes.length
    ? semantic.commitThemes
    : compressed.commitThemes;
  if (themes.length > 0) {
    lines.push("Commit themes:");
    for (const theme of themes) {
      lines.push(`- ${theme}`);
    }
  }

  if (semantic?.primaryAreas.length) {
    lines.push("", "Primary areas:");
    for (const area of semantic.primaryAreas) {
      lines.push(`- ${area}`);
    }
  }

  if (semantic?.symbolSummary.length) {
    lines.push("", "Symbol summary:");
    for (const summary of semantic.symbolSummary) {
      lines.push(`- ${summary}`);
    }
  }

  if (semantic?.changeProfile) {
    const profile = semantic.changeProfile;
    lines.push(
      "",
      `Change profile: ${profile.added} added, ${profile.modified} modified, ${profile.removed} removed, ${profile.renamed} renamed`,
    );
    const languages = Object.entries(profile.languages);
    if (languages.length > 0) {
      lines.push(
        "Languages:",
        ...languages.map(([language, count]) => `- ${language}: ${count} files`),
      );
    }
  }

  if (compressed.topLevelSignals.length > 0) {
    lines.push("", "Top-level signals:");
    for (const signal of compressed.topLevelSignals) {
      lines.push(`- ${signal}`);
    }
  }

  return lines.join("\n").trim();
}
