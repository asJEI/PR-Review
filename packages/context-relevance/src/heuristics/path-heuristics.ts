export interface PathHeuristicMatch {
  boost: number;
  reason: string;
}

const PATH_RULES: Array<{ pattern: RegExp; boost: number; reason: string }> = [
  { pattern: /(?:^|\/)(auth|jwt|session|permission)(?:\/|$)/i, boost: 0.25, reason: "authentication-related path" },
  { pattern: /(?:^|\/)(db|database|migration|repository|dao)(?:\/|$)/i, boost: 0.2, reason: "database-related path" },
  { pattern: /(?:^|\/)middleware(?:\/|$)|handler|controller|(?:^|\/)api(?:\/|$)/i, boost: 0.15, reason: "API or middleware path" },
  { pattern: /(?:^|\/)config(?:\/|$)|infra|\.env|docker/i, boost: 0.1, reason: "infrastructure or config path" },
];

export function scorePathHeuristics(filename: string): PathHeuristicMatch[] {
  const matches: PathHeuristicMatch[] = [];

  for (const rule of PATH_RULES) {
    if (rule.pattern.test(filename)) {
      matches.push({ boost: rule.boost, reason: rule.reason });
    }
  }

  return matches;
}

export function sumPathBoost(filename: string): { boost: number; reasons: string[] } {
  const matches = scorePathHeuristics(filename);

  return {
    boost: matches.reduce((sum, match) => sum + match.boost, 0),
    reasons: matches.map((match) => match.reason),
  };
}
