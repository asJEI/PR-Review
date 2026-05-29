import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packages = ["shared", "diff-parser", "github", "context-builder", "context-compressor", "context-relevance", "focused-diff", "line-mapping", "prompt-builder", "ai"];

for (const pkg of packages) {
  const dir = path.join(root, "packages", pkg);
  console.log(`Building @pr-review/${pkg}...`);
  execSync("npx tsc -p tsconfig.json", { cwd: dir, stdio: "inherit" });
}

const apps = ["server"];
for (const app of apps) {
  const dir = path.join(root, "apps", app);
  console.log(`Building @pr-review/${app}...`);
  execSync("npx tsc -p tsconfig.json", { cwd: dir, stdio: "inherit" });
}

console.log("Build complete.");
