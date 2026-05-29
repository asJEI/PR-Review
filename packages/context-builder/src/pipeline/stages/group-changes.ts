import type { ChangeGroup } from "@pr-review/shared";

import { findConnectedComponents } from "../../graph/file-dependency-graph.js";
import type { PipelineState } from "../types.js";

function directoryPrefix(filename: string): string {
  const lastSlash = filename.lastIndexOf("/");

  if (lastSlash === -1) {
    return "/";
  }

  return filename.slice(0, lastSlash + 1);
}

function groupByDirectory(files: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const file of files) {
    const prefix = directoryPrefix(file);
    const list = groups.get(prefix) ?? [];
    list.push(file);
    groups.set(prefix, list);
  }

  return groups;
}

export function groupChanges(state: PipelineState): PipelineState {
  const files = state.parsedFiles.map((e) => e.changedFile.filename);
  const groups: ChangeGroup[] = [];
  const assigned = new Set<string>();
  let groupIndex = 0;

  const renamedPairs = state.parsedFiles.filter(
    (e) => e.changedFile.previousFilename,
  );

  for (const entry of renamedPairs) {
    const prev = entry.changedFile.previousFilename;

    if (!prev) {
      continue;
    }

    const id = `group-rename-${groupIndex}`;
    groupIndex += 1;

    groups.push({
      id,
      label: `Renamed: ${prev}`,
      files: [prev, entry.changedFile.filename],
      rationale: "File rename detected via previousFilename",
    });

    assigned.add(prev);
    assigned.add(entry.changedFile.filename);
  }

  const connected = findConnectedComponents(
    files,
    state.dependencyGraph.edges,
  );

  for (const component of connected) {
    if (component.length < 2) {
      continue;
    }

    const unassigned = component.filter((f) => !assigned.has(f));

    if (unassigned.length < 2) {
      continue;
    }

    const id = `group-deps-${groupIndex}`;
    groupIndex += 1;

    for (const f of unassigned) {
      assigned.add(f);
    }

    groups.push({
      id,
      label: `Related via imports (${unassigned.length} files)`,
      files: unassigned,
      rationale: "Files connected through internal import edges",
    });
  }

  const dirGroups = groupByDirectory(files.filter((f) => !assigned.has(f)));

  for (const [prefix, members] of dirGroups) {
    if (members.length < 2) {
      continue;
    }

    const id = `group-dir-${groupIndex}`;
    groupIndex += 1;

    for (const f of members) {
      assigned.add(f);
    }

    groups.push({
      id,
      label: prefix === "/" ? "Root files" : prefix,
      files: members,
      rationale: "Files sharing the same directory prefix",
    });
  }

  for (const file of files) {
    if (!assigned.has(file)) {
      groups.push({
        id: `group-single-${groupIndex}`,
        label: file,
        files: [file],
        rationale: "Standalone file change",
      });
      groupIndex += 1;
    }
  }

  return { ...state, changeGroups: groups };
}
