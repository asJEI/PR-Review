import type { ParsedFileDiff } from "../../types.js";
import type { PatternSet } from "../patterns/types.js";
import type { SemanticInterface } from "../types.js";
import {
  collectSemanticLines,
  firstCapture,
  lineNumber,
  resolveChangeType,
} from "../utils/line-utils.js";

export function extractInterfaces(
  parsed: ParsedFileDiff,
  patterns: PatternSet,
): SemanticInterface[] {
  const interfaceAdds = new Set<string>();
  const interfaceRemoves = new Set<string>();
  const typeAdds = new Set<string>();
  const typeRemoves = new Set<string>();
  const meta = new Map<string, { line?: number; kind: "interface" | "type" }>();

  for (const { line, changeSide } of collectSemanticLines(parsed.hunks)) {
    const iface = firstCapture(patterns.interface, line.content);
    const typeAlias = firstCapture(patterns.typeAlias, line.content);

    if (iface) {
      if (changeSide === "add") {
        interfaceAdds.add(iface);
      } else {
        interfaceRemoves.add(iface);
      }
      meta.set(iface, { line: lineNumber(line), kind: "interface" });
    }

    if (typeAlias) {
      if (changeSide === "add") {
        typeAdds.add(typeAlias);
      } else {
        typeRemoves.add(typeAlias);
      }
      meta.set(typeAlias, { line: lineNumber(line), kind: "type" });
    }
  }

  const results: SemanticInterface[] = [];

  for (const name of new Set([...interfaceAdds, ...interfaceRemoves])) {
    results.push({
      name,
      kind: "interface",
      changeType: resolveChangeType(interfaceAdds, interfaceRemoves, name),
      line: meta.get(name)?.line,
    });
  }

  for (const name of new Set([...typeAdds, ...typeRemoves])) {
    results.push({
      name,
      kind: "type",
      changeType: resolveChangeType(typeAdds, typeRemoves, name),
      line: meta.get(name)?.line,
    });
  }

  return results;
}
