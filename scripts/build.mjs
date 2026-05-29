import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packages = ["shared", "diff-parser", "github", "context-builder"];

for (const pkg of packages) {
  const dir = path.join(root, "packages", pkg);
  console.log(`Building @pr-review/${pkg}...`);
  execSync("npx tsc -p tsconfig.json", { cwd: dir, stdio: "inherit" });
}

console.log("Build complete.");
