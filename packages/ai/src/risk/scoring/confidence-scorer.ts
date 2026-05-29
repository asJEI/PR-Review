import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewContext,
  RiskConfidenceLabel,
  RiskReviewItem,
  RiskReviewReport,
} from "@pr-review/shared";

const BASE_CONFIDENCE: Record<RiskConfidenceLabel, number> = {
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

const GENERIC_PHRASES = [
  /potential security issue/i,
  /may be vulnerable/i,
  /could cause problems/i,
  /might be unsafe/i,
  /possible risk/i,
];

const STYLE_PHRASES = [
  /naming convention/i,
  /code style/i,
  /formatting/i,
  /lint/i,
  /variable name/i,
];

export interface ConfidenceScoringContext {
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
  knownPaths: Set<string>;
  unknownFiles: string[];
}

export interface ConfidenceScoreResult {
  score: number;
  label: RiskConfidenceLabel;
  reasons: string[];
}

export function confidenceLabelFromScore(score: number): RiskConfidenceLabel {
  if (score >= 0.75) {
    return "high";
  }
  if (score >= 0.5) {
    return "medium";
  }
  return "low";
}

function collectRiskSignals(
  compressedContext: CompressedReviewContext,
  reviewContext?: ReviewContext,
): string[] {
  const signals: string[] = [];

  for (const module of compressedContext.modules) {
    signals.push(...module.riskContext);
    for (const change of module.logicChanges) {
      signals.push(...change.riskSignals);
    }
  }

  if (reviewContext) {
    signals.push(...reviewContext.semanticSummary.riskHints);
  }

  return signals;
}

function matchesRiskSignal(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((signal) => {
    const signalLower = signal.toLowerCase();
    return lower.includes(signalLower) || signalLower.includes(lower.slice(0, 30));
  });
}

function isHighPriorityFile(file: string, relevanceReport: RelevanceReport): boolean {
  const entry = relevanceReport.files.find((item) => item.file === file);
  return entry?.priority === "critical" || entry?.priority === "high";
}

export function scoreRiskConfidence(
  item: RiskReviewItem,
  context: ConfidenceScoringContext,
): ConfidenceScoreResult {
  const reasons: string[] = [];
  let score = BASE_CONFIDENCE[item.confidence];
  reasons.push(`LLM confidence baseline: ${item.confidence} (${score})`);

  const riskSignals = collectRiskSignals(context.compressedContext, context.reviewContext);

  for (const file of item.affectedFiles) {
    if (isHighPriorityFile(file, context.relevanceReport)) {
      score += 0.1;
      reasons.push(`High-priority file match: ${file}`);
      break;
    }
  }

  const combinedText = `${item.description} ${item.reasoning}`;
  if (matchesRiskSignal(combinedText, riskSignals)) {
    score += 0.1;
    reasons.push("Matches compressed or semantic risk signal");
  }

  if (context.reviewContext) {
    const hints = context.reviewContext.semanticSummary.riskHints.join(" ").toLowerCase();
    if (hints.includes(item.category.replace("/", " ")) || hints.includes(item.category)) {
      score += 0.05;
      reasons.push("Category aligns with semantic risk hints");
    }
  }

  for (const unknown of context.unknownFiles) {
    if (item.description.includes(unknown) || item.affectedFiles.includes(unknown)) {
      score -= 0.2;
      reasons.push(`Unknown file reference penalty: ${unknown}`);
    }
  }

  for (const phrase of GENERIC_PHRASES) {
    if (phrase.test(combinedText)) {
      score -= 0.15;
      reasons.push(`Generic phrasing penalty: ${phrase.source}`);
    }
  }

  for (const phrase of STYLE_PHRASES) {
    if (phrase.test(combinedText) || phrase.test(item.category)) {
      score -= 0.1;
      reasons.push(`Style/lint wording penalty: ${phrase.source}`);
    }
  }

  score = Math.max(0, Math.min(1, score));
  return {
    score,
    label: confidenceLabelFromScore(score),
    reasons,
  };
}

export interface FilterByConfidenceOptions {
  minConfidenceScore: number;
  includeMediumConfidence: boolean;
}

export function filterRisksByConfidence(
  report: RiskReviewReport,
  options: FilterByConfidenceOptions,
): { report: RiskReviewReport; filteredCount: number } {
  const retained: RiskReviewItem[] = [];
  let filteredCount = 0;

  for (const risk of report.risks) {
    const passesThreshold = risk.confidenceScore >= options.minConfidenceScore;
    const criticalWithKnownFile =
      risk.severity === "critical" && risk.affectedFiles.length > 0;

    if (passesThreshold || criticalWithKnownFile) {
      if (!options.includeMediumConfidence && risk.confidence === "medium" && !passesThreshold) {
        filteredCount += 1;
        continue;
      }
      retained.push(risk);
    } else {
      filteredCount += 1;
    }
  }

  return {
    report: {
      ...report,
      risks: retained,
      meta: {
        ...report.meta,
        filteredCount,
      },
    },
    filteredCount,
  };
}

export function applyConfidenceScoring(
  report: RiskReviewReport,
  context: ConfidenceScoringContext,
): RiskReviewReport {
  const risks = report.risks.map((item) => {
    const scored = scoreRiskConfidence(item, context);
    return {
      ...item,
      confidenceScore: scored.score,
      confidence: scored.label,
    };
  });

  return { ...report, risks };
}
