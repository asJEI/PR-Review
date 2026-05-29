import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewContext,
} from "@pr-review/shared";

const FILE_PATH_PATTERN = /(?:^|[\s(])((?:[\w.-]+\/)+[\w.-]+\.\w{1,8})(?:[\s),]|$)/g;

export function collectKnownPaths(
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): Set<string> {
  const known = new Set<string>();

  for (const file of relevanceReport.rankedFileOrder) {
    known.add(file);
  }

  for (const module of compressedContext.modules) {
    known.add(module.module);
    for (const fn of module.affectedFunctions) {
      known.add(`${module.module}::${fn.name}`);
    }
    for (const dep of module.expandedDependencies) {
      known.add(dep);
    }
  }

  if (reviewContext) {
    for (const file of reviewContext.files) {
      known.add(file.filename);
    }
    for (const area of reviewContext.semanticSummary.primaryAreas) {
      known.add(area);
    }
  }

  return known;
}

export function extractFileLikeTokens(text: string): string[] {
  const matches: string[] = [];
  for (const match of text.matchAll(FILE_PATH_PATTERN)) {
    const path = match[1];
    if (path) {
      matches.push(path);
    }
  }
  return matches;
}

export function parseLocationPaths(location: string): string[] {
  const paths = new Set<string>();

  for (const token of extractFileLikeTokens(location)) {
    paths.add(token);
  }

  const fileSymbol = location.match(/^([^\s:]+(?:::[^\s]+)?)/);
  if (fileSymbol?.[1]?.includes("/")) {
    paths.add(fileSymbol[1].split("::")[0]!);
  }

  return [...paths];
}

export function isKnownReference(reference: string, known: Set<string>): boolean {
  if (known.has(reference)) {
    return true;
  }

  for (const entry of known) {
    if (reference.startsWith(entry) || entry.includes(reference) || reference.startsWith(entry)) {
      return true;
    }
  }

  return false;
}

export function filterKnownFiles(paths: string[], known: Set<string>): string[] {
  return paths.filter((path) => isKnownReference(path, known));
}
