import type { PatternSet } from "./types.js";

export const pythonPatterns: PatternSet = {
  function: [/^\s*(?:async\s+)?def\s+(\w+)/],
  class: [/^\s*class\s+(\w+)/],
  interface: [],
  typeAlias: [],
  import: [
    /^\s*from\s+([\w.]+)\s+import/,
    /^\s*import\s+([\w.]+)/,
  ],
  export: [/^\s*__all__\s*=/],
};
