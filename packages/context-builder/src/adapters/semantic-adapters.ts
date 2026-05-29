import type { SemanticAnalysis } from "@pr-review/diff-parser";
import type { ImportEdge, ImportKind, SymbolChange, SymbolKind } from "@pr-review/shared";

import {
  matchInternalTarget,
  resolveRelativePath,
} from "../utils/import-path-utils.js";

function toSymbolKind(
  kind: "interface" | "type" | "function" | "class" | "method",
): SymbolKind {
  if (kind === "type") {
    return "type";
  }

  return kind;
}

export function mapSemanticToSymbolChanges(
  semantic: SemanticAnalysis,
  maxSymbols: number,
): SymbolChange[] {
  const symbols: SymbolChange[] = [];

  for (const fn of semantic.functions) {
    symbols.push({
      name: fn.name,
      kind: fn.scope ? "method" : "function",
      changeType: fn.changeType,
      scope: fn.scope,
      line: fn.line,
    });
  }

  for (const cls of semantic.classes) {
    symbols.push({
      name: cls.name,
      kind: "class",
      changeType: cls.changeType,
      line: cls.line,
    });
  }

  for (const iface of semantic.interfaces) {
    symbols.push({
      name: iface.name,
      kind: toSymbolKind(iface.kind),
      changeType: iface.changeType,
      line: iface.line,
    });
  }

  return symbols.slice(0, maxSymbols);
}

function edgeFromSpecifier(
  filename: string,
  specifier: string,
  changedSet: Set<string>,
  changeSide: "added" | "removed",
): ImportEdge | null {
  const resolved = resolveRelativePath(filename, specifier);
  const isInternal = resolved !== null;
  const to = isInternal
    ? (matchInternalTarget(resolved, changedSet) ?? resolved)
    : specifier;

  const kind: ImportKind = specifier.includes(".") && !specifier.startsWith(".")
    ? "python"
    : "esm";

  return {
    from: filename,
    to,
    kind,
    edgeType: isInternal ? "internal" : "external",
  };
}

export function mapSemanticToImportEdges(
  filename: string,
  semantic: SemanticAnalysis,
  changedFiles: string[],
): ImportEdge[] {
  const changedSet = new Set(changedFiles);
  const seen = new Set<string>();
  const edges: ImportEdge[] = [];

  for (const specifier of semantic.imports.added) {
    const edge = edgeFromSpecifier(filename, specifier, changedSet, "added");
    if (!edge) {
      continue;
    }

    const key = `${edge.from}->${edge.to}:${edge.kind}:added`;
    if (!seen.has(key)) {
      seen.add(key);
      edges.push(edge);
    }
  }

  for (const specifier of semantic.imports.removed) {
    const edge = edgeFromSpecifier(filename, specifier, changedSet, "removed");
    if (!edge) {
      continue;
    }

    const key = `${edge.from}->${edge.to}:${edge.kind}:removed`;
    if (!seen.has(key)) {
      seen.add(key);
      edges.push(edge);
    }
  }

  return edges;
}
