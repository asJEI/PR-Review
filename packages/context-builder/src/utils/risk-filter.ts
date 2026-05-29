import type { RiskAnalysisResult, RiskCategory, RiskFinding } from "@pr-review/diff-parser";

const DATA_FILE_PATTERN = /\.(json|md|lock|toml|yaml|yml|csv)$/i;

const CODE_LANGUAGES = new Set([
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "java",
]);

const CODE_ONLY_RISKS = new Set<RiskCategory>([
  "databaseOperationModified",
  "errorHandlingRemoved",
]);

export function isCodeFile(filename: string, language: string): boolean {
  if (DATA_FILE_PATTERN.test(filename)) {
    return false;
  }

  return language !== "unknown" && CODE_LANGUAGES.has(language);
}

export function filterRiskForFile(
  risk: RiskAnalysisResult,
  filename: string,
  language: string,
): RiskAnalysisResult {
  if (isCodeFile(filename, language)) {
    return risk;
  }

  const findings = risk.findings.filter(
    (finding) => !CODE_ONLY_RISKS.has(finding.id),
  );

  return toFilteredRisk(findings);
}

function toFilteredRisk(findings: RiskFinding[]): RiskAnalysisResult {
  return {
    findings,
    riskHints: [...new Set(findings.map((finding) => finding.message))],
  };
}
