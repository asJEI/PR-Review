import { LLMProviderError } from "../utils/errors.js";

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs?: number;
}

export interface RetryStrategyOptions {
  retryDelayMs?: number;
  retryAfterHeader?: string | null;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return true;
  }
  if (error instanceof LLMProviderError && error.statusCode === 408) {
    return true;
  }
  return false;
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof LLMProviderError && error.statusCode === 429;
}

export function isServerError(error: unknown): boolean {
  return (
    error instanceof LLMProviderError &&
    error.statusCode !== undefined &&
    error.statusCode >= 500
  );
}

export function shouldRetryProviderError(error: unknown): boolean {
  if (isTimeoutError(error) || isRateLimitError(error) || isServerError(error)) {
    return true;
  }
  if (error instanceof LLMProviderError) {
    return false;
  }
  return true;
}

export function computeRetryDelay(
  attempt: number,
  options: RetryStrategyOptions = {},
): number {
  const base = options.retryDelayMs ?? 500;
  const exponential = base * 2 ** attempt;

  if (options.retryAfterHeader) {
    const retryAfterSeconds = Number(options.retryAfterHeader);
    if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.max(exponential, retryAfterSeconds * 1000);
    }
  }

  return exponential;
}

export function evaluateRetry(error: unknown, attempt: number, options?: RetryStrategyOptions): RetryDecision {
  if (!shouldRetryProviderError(error)) {
    return { shouldRetry: false };
  }

  return {
    shouldRetry: true,
    delayMs: computeRetryDelay(attempt, options),
  };
}
