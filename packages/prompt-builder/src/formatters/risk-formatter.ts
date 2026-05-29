import type { MergedModuleContext } from "../pipeline/types.js";

const RISK_CATEGORIES = [
  "auth/security",
  "async/concurrency",
  "database/cache",
  "error handling removed",
] as const;

function categorizeRisk(signal: string): string | null {
  const lower = signal.toLowerCase();
  if (/auth|login|token|jwt|session|permission|password|middleware/.test(lower)) {
    return "auth/security";
  }
  if (/async|await|promise|concurr|race|parallel/.test(lower)) {
    return "async/concurrency";
  }
  if (/database|db|cache|redis|sql|query|migration/.test(lower)) {
    return "database/cache";
  }
  if (/error handling|try.?catch|removed.*catch|swallow/.test(lower)) {
    return "error handling removed";
  }
  return null;
}

export function formatRiskSignals(riskSignals: string[]): string {
  if (riskSignals.length === 0) {
    return "No explicit risk signals detected in compressed context.";
  }

  const grouped = new Map<string, string[]>();
  for (const category of RISK_CATEGORIES) {
    grouped.set(category, []);
  }
  grouped.set("other", []);

  for (const signal of riskSignals) {
    const category = categorizeRisk(signal) ?? "other";
    grouped.get(category)?.push(signal);
  }

  const lines: string[] = [];
  for (const [category, signals] of grouped) {
    if (signals.length === 0) {
      continue;
    }
    lines.push(`## ${category}`);
    for (const signal of signals) {
      lines.push(`- ${signal}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function formatModuleRiskContext(modules: MergedModuleContext[], limit: number): string {
  const lines: string[] = [];

  for (const entry of modules.slice(0, limit)) {
    const risks = entry.compressed.riskContext;
    if (risks.length === 0) {
      continue;
    }

    lines.push(`### [${entry.priority}] ${entry.module}`);
    for (const risk of risks) {
      lines.push(`- ${risk}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() || "No module-level risk context available.";
}

export function formatLogicChangeRisks(modules: MergedModuleContext[], limit: number): string {
  const lines: string[] = [];

  for (const entry of modules.slice(0, limit)) {
    for (const change of entry.compressed.logicChanges) {
      if (change.riskSignals.length === 0) {
        continue;
      }
      lines.push(`- ${change.symbol} (${entry.module}): ${change.riskSignals.join("; ")}`);
    }
  }

  return lines.length > 0
    ? ["Logic change risk signals:", ...lines].join("\n")
    : "No logic-change risk signals detected.";
}
