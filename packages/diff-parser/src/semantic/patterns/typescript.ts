import type { PatternSet } from "./types.js";

export const typescriptPatterns: PatternSet = {
  function: [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/,
  ],
  class: [/^\s*(?:export\s+)?class\s+(\w+)/],
  interface: [/^\s*(?:export\s+)?interface\s+(\w+)/],
  typeAlias: [/^\s*(?:export\s+)?type\s+(\w+)/],
  import: [
    /^\s*import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/,
    /^\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/,
  ],
  export: [
    /^\s*export\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/,
    /^\s*export\s+default\s+/,
    /^\s*export\s+(?:async\s+)?function\s+(\w+)/,
    /^\s*export\s+(?:const|let)\s+(\w+)/,
    /^\s*export\s+class\s+(\w+)/,
    /^\s*export\s+interface\s+(\w+)/,
    /^\s*export\s+type\s+(\w+)/,
  ],
};
