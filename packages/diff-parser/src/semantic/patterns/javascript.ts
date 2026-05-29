import type { PatternSet } from "./types.js";

export const javascriptPatterns: PatternSet = {
  function: [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
  ],
  class: [/^\s*(?:export\s+)?class\s+(\w+)/],
  interface: [],
  typeAlias: [],
  import: [
    /^\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/,
    /^\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/,
    /^\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/,
  ],
  export: [
    /^\s*module\.exports\s*=/,
    /^\s*exports\.\w+\s*=/,
    /^\s*export\s+default\s+/,
    /^\s*export\s+(?:async\s+)?function\s+(\w+)/,
    /^\s*export\s+(?:const|let)\s+(\w+)/,
    /^\s*export\s+class\s+(\w+)/,
  ],
};
