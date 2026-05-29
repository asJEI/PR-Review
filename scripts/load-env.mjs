/**
 * Load root `.env` into process.env (does not override existing vars).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function findEnvPath(startDir) {
  let dir = startDir;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

export function loadEnv(options = {}) {
  const startDir = options.cwd ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  const envPath = findEnvPath(startDir);
  if (!envPath) {
    return { loaded: false, path: null };
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return { loaded: true, path: envPath };
}

export function hasLlmApiKey(env = process.env) {
  return Boolean(
    env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY || env.ANTHROPIC_API_KEY,
  );
}
