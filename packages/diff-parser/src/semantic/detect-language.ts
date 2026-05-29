const EXTENSION_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
};

export function detectLanguage(filename: string): string {
  const base = filename.split("/").pop() ?? filename;
  const dot = base.lastIndexOf(".");

  if (dot === -1) {
    return "unknown";
  }

  const ext = base.slice(dot + 1).toLowerCase();
  return EXTENSION_MAP[ext] ?? "unknown";
}
