export function resolveFilePath(
  file: string,
  pathAliases: Record<string, string>,
): string {
  return pathAliases[file] ?? file;
}

export function buildPathAliases(
  entries: Array<{ filename: string; previousFilename?: string }>,
): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.previousFilename) {
      aliases[entry.previousFilename] = entry.filename;
    }
  }
  return aliases;
}

export function invertPathAliases(
  pathAliases: Record<string, string>,
): Record<string, string> {
  const inverted: Record<string, string> = {};
  for (const [previous, current] of Object.entries(pathAliases)) {
    inverted[current] = previous;
  }
  return inverted;
}
