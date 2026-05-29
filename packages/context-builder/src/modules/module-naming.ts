import type { ChangeGroup } from "@pr-review/shared";

/** Derives a stable module name from a change group label and files. */
export function deriveModuleName(group: ChangeGroup): string {
  const { label, files } = group;

  if (label.startsWith("Renamed:")) {
    return normalizePath(files[0] ?? label);
  }

  if (label.startsWith("Related via imports")) {
    return commonDirectoryPrefix(files) ?? "related";
  }

  if (label.endsWith("/") || label === "Root files") {
    return label === "Root files" ? "root" : normalizePath(label);
  }

  if (files.length === 1) {
    return normalizePath(files[0] ?? label);
  }

  return normalizePath(commonDirectoryPrefix(files) ?? label);
}

function normalizePath(value: string): string {
  return value.replace(/\/+$/, "").replace(/^\.\//, "") || "root";
}

function commonDirectoryPrefix(files: string[]): string | null {
  if (files.length === 0) {
    return null;
  }

  const parts = files.map((file) => file.split("/"));

  if (parts.every((segments) => segments.length === 1)) {
    return files[0] ?? null;
  }

  const first = parts[0] ?? [];
  const shared: string[] = [];

  for (let index = 0; index < first.length - 1; index += 1) {
    const segment = first[index];

    if (segment === undefined) {
      break;
    }

    if (parts.every((segments) => segments[index] === segment)) {
      shared.push(segment);
    } else {
      break;
    }
  }

  if (shared.length === 0) {
    return files[0] ?? null;
  }

  return `${shared.join("/")}/`;
}
