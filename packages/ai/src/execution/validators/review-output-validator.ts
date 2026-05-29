import type {
  PrSummary,
  ReviewCommentReport,
  RiskReviewReport,
} from "@pr-review/shared";

import { ReviewExecutionValidationError } from "../../utils/errors.js";

export interface ReviewOutputValidationOptions {
  strictOutput: boolean;
}

export function validateReviewOutput(
  summary: PrSummary,
  risks: RiskReviewReport,
  comments: ReviewCommentReport,
  options: ReviewOutputValidationOptions,
): void {
  const errors: string[] = [];

  if (!summary.title.trim()) {
    errors.push("Summary title is required");
  }
  if (!summary.summary.trim()) {
    errors.push("Summary body is required");
  }
  if (summary.keyChanges.length === 0) {
    errors.push("Summary keyChanges must not be empty");
  }
  if (summary.affectedSystems.length === 0) {
    errors.push("Summary affectedSystems must not be empty");
  }
  if (!summary.architecturalImpact.trim()) {
    errors.push("Summary architecturalImpact is required");
  }

  for (const [index, risk] of risks.risks.entries()) {
    if (!risk.severity || !risk.category || !risk.description.trim()) {
      errors.push(`Risk ${index} missing required fields`);
    }
    if (risk.affectedFiles.length === 0) {
      errors.push(`Risk ${index} must reference affectedFiles`);
    }
    if (!risk.confidence) {
      errors.push(`Risk ${index} missing confidence`);
    }
  }

  for (const [index, comment] of comments.comments.entries()) {
    if (!comment.file.trim() || !comment.comment.trim() || !comment.severity || !comment.confidence) {
      errors.push(`Comment ${index} missing required fields`);
    }
  }

  const hasGroundedOutput = risks.risks.length > 0 || comments.comments.length > 0;
  if (options.strictOutput && !hasGroundedOutput) {
    errors.push("Strict output requires at least one grounded risk or comment");
  }

  if (errors.length > 0) {
    throw new ReviewExecutionValidationError(errors.join("; "));
  }
}
