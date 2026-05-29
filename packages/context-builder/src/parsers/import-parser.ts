import type { DiffLine, ParsedFileDiff } from "@pr-review/diff-parser";
import type { ImportEdge, ImportKind } from "@pr-review/shared";

const IMPORT_PATTERNS: { regex: RegExp; kind: ImportKind }[] = [
  {
    regex: /import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/,
    kind: "esm",
  },
  {
    regex: /export\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/,
    kind: "esm",
  },
  { regex: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/, kind: "cjs" },
  { regex: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/, kind: "dynamic" },
  { regex: /from\s+([\w.]+)\s+import/, kind: "python" },
  { regex: /^import\s+([\w./]+)/, kind: "python" },
  { regex: /import\s+(?:\w+\s+)?['"]([^'"]+)['"]/, kind: "go" },
];

function resolveRelativePath(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const fromParts = fromFile.split("/");
  fromParts.pop();

  for (const part of specifier.split("/")) {
    if (part === "." || part === "") {
      continue;
    }

    if (part === "..") {
      fromParts.pop();
    } else {
      fromParts.push(part);
    }
  }

  return fromParts.join("/");
}

function normalizeInternalPath(path: string): string {
  return path.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
}

function matchInternalTarget(
  resolved: string,
  changedFiles: Set<string>,
): string | null {
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    `${resolved}/index.ts`,
    `${resolved}/index.tsx`,
    `${resolved}/index.js`,
  ];

  for (const candidate of candidates) {
    if (changedFiles.has(candidate)) {
      return candidate;
    }
  }

  const normalized = normalizeInternalPath(resolved);

  for (const file of changedFiles) {
    if (normalizeInternalPath(file) === normalized) {
      return file;
    }
  }

  return null;
}

function extractSpecifier(line: string): { specifier: string; kind: ImportKind } | null {
  for (const pattern of IMPORT_PATTERNS) {
    const match = pattern.regex.exec(line);

    if (match?.[1]) {
      return { specifier: match[1], kind: pattern.kind };
    }
  }

  return null;
}

export function extractImportsFromDiff(
  filename: string,
  parsedDiff: ParsedFileDiff,
  changedFiles: string[],
): ImportEdge[] {
  const changedSet = new Set(changedFiles);
  const seen = new Set<string>();
  const edges: ImportEdge[] = [];

  const allLines: DiffLine[] = parsedDiff.hunks.flatMap((h) => h.lines);

  for (const line of allLines) {
    const extracted = extractSpecifier(line.content);

    if (!extracted) {
      continue;
    }

    const { specifier, kind } = extracted;
    const resolved = resolveRelativePath(filename, specifier);
    const isInternal = resolved !== null;
    const to = isInternal
      ? (matchInternalTarget(resolved, changedSet) ?? resolved)
      : specifier;

    const edgeType = isInternal ? "internal" : "external";
    const key = `${filename}->${to}:${kind}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    edges.push({ from: filename, to, kind, edgeType });
  }

  return edges;
}
