export function resolveRelativePath(
  fromFile: string,
  specifier: string,
): string | null {
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

export function normalizeInternalPath(path: string): string {
  return path.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
}

export function matchInternalTarget(
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
