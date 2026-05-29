function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9_./-]+/)
      .filter((token) => token.length >= 3),
  );
}

function overlapScore(theme: string, files: string[]): number {
  const themeLower = theme.toLowerCase();
  let score = 0;

  for (const file of files) {
    const basename = file.split("/").pop()?.toLowerCase() ?? "";
    const dirParts = file.toLowerCase().split("/");

    if (basename && themeLower.includes(basename.replace(/\.[^.]+$/, ""))) {
      score += 4;
    }

    for (const part of dirParts) {
      if (part.length >= 3 && themeLower.includes(part)) {
        score += 2;
      }
    }

    const themeTokens = tokenize(theme);
    const fileTokens = tokenize(file);

    for (const token of themeTokens) {
      if (fileTokens.has(token)) {
        score += 2;
      }
    }
  }

  return score;
}

export function matchCommitTheme(
  commitThemes: string[],
  relatedFiles: string[],
): string | null {
  let bestTheme: string | null = null;
  let bestScore = 0;

  for (const theme of commitThemes) {
    const score = overlapScore(theme, relatedFiles);

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  if (bestScore === 0 || bestTheme === null) {
    return null;
  }

  return bestTheme.length > 120 ? `${bestTheme.slice(0, 117)}...` : bestTheme;
}

export function filterRelevantCommitThemes(
  commitThemes: string[],
  activeModules: { relatedFiles: string[] }[],
): string[] {
  const allFiles = activeModules.flatMap((module) => module.relatedFiles);
  const relevant: string[] = [];

  for (const theme of commitThemes) {
    if (overlapScore(theme, allFiles) > 0) {
      relevant.push(theme);
    }
  }

  return relevant.length > 0 ? relevant : commitThemes.slice(0, 3);
}
