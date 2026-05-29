import type { ImportEdge } from "@pr-review/shared";

export interface FileDependencyGraph {
  nodes: string[];
  edges: ImportEdge[];
}

export function buildDependencyGraph(
  fileImports: Map<string, ImportEdge[]>,
): FileDependencyGraph {
  const nodeSet = new Set<string>();
  const edges: ImportEdge[] = [];

  for (const [file, imports] of fileImports) {
    nodeSet.add(file);

    for (const edge of imports) {
      nodeSet.add(edge.from);
      if (edge.edgeType === "internal") {
        nodeSet.add(edge.to);
      }
      edges.push(edge);
    }
  }

  return {
    nodes: [...nodeSet].sort(),
    edges,
  };
}

/** Union-find style grouping by internal import connectivity. */
export function findConnectedComponents(
  files: string[],
  edges: ImportEdge[],
): string[][] {
  const internalEdges = edges.filter((e) => e.edgeType === "internal");
  const parent = new Map<string, string>();

  for (const file of files) {
    parent.set(file, file);
  }

  const find = (x: string): string => {
    const p = parent.get(x) ?? x;

    if (p !== x) {
      const root = find(p);
      parent.set(x, root);
      return root;
    }

    return x;
  };

  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    parent.set(ra, rb);
  };

  for (const edge of internalEdges) {
    if (parent.has(edge.from) && parent.has(edge.to)) {
      union(edge.from, edge.to);
    }
  }

  const groups = new Map<string, string[]>();

  for (const file of files) {
    const root = find(file);
    const list = groups.get(root) ?? [];
    list.push(file);
    groups.set(root, list);
  }

  return [...groups.values()].filter((g) => g.length > 0);
}
