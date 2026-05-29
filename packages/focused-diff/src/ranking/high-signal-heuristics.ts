export interface HighSignalMatch {
  boost: number;
  signal: string;
}

const HIGH_SIGNAL_RULES: Array<{ pattern: RegExp; boost: number; signal: string }> = [
  { pattern: /auth|jwt|token|login|session|password|middleware/i, boost: 0.15, signal: "auth" },
  { pattern: /async|await|concurr|race|parallel|promise/i, boost: 0.12, signal: "async" },
  { pattern: /database|db\b|sql|migration|insert|update|delete|write/i, boost: 0.12, signal: "database" },
  { pattern: /cache|redis|memo/i, boost: 0.1, signal: "cache" },
  { pattern: /export\s|module\.exports|public\s/i, boost: 0.08, signal: "export" },
  { pattern: /middleware|handler|interceptor/i, boost: 0.15, signal: "middleware" },
];

export function scoreHighSignalText(text: string): HighSignalMatch[] {
  const matches: HighSignalMatch[] = [];
  const seen = new Set<string>();

  for (const rule of HIGH_SIGNAL_RULES) {
    if (rule.pattern.test(text) && !seen.has(rule.signal)) {
      seen.add(rule.signal);
      matches.push({ boost: rule.boost, signal: rule.signal });
    }
  }

  return matches;
}

export function aggregateHighSignalBoost(matches: HighSignalMatch[]): number {
  return matches.reduce((sum, match) => sum + match.boost, 0);
}

export function highSignalLabels(matches: HighSignalMatch[]): string[] {
  return matches.map((match) => match.signal);
}
