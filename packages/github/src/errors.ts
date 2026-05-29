import type { ParsedPrUrl } from "@pr-review/shared";

/** Base error for all GitHub fetcher failures. */
export class GitHubFetcherError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "GitHubFetcherError";
    this.code = code;
  }
}

export class GitHubValidationError extends GitHubFetcherError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("VALIDATION_ERROR", message, options);
    this.name = "GitHubValidationError";
  }
}

export class GitHubUrlParseError extends GitHubFetcherError {
  readonly prUrl: string;

  constructor(prUrl: string, message?: string) {
    super(
      "URL_PARSE_ERROR",
      message ?? `Invalid GitHub pull request URL: ${prUrl}`,
    );
    this.name = "GitHubUrlParseError";
    this.prUrl = prUrl;
  }
}

export class GitHubNotFoundError extends GitHubFetcherError {
  readonly source: ParsedPrUrl;

  constructor(source: ParsedPrUrl, resource: string) {
    super(
      "NOT_FOUND",
      `${resource} not found for ${source.owner}/${source.repo}#${source.pullNumber}`,
    );
    this.name = "GitHubNotFoundError";
    this.source = source;
  }
}

export class GitHubRateLimitError extends GitHubFetcherError {
  readonly resetAt: Date | null;
  readonly limit: number | null;
  readonly remaining: number | null;

  constructor(options: {
    resetAt: Date | null;
    limit: number | null;
    remaining: number | null;
  }) {
    const resetLabel = options.resetAt?.toISOString() ?? "unknown";
    super(
      "RATE_LIMIT",
      `GitHub API rate limit exceeded. Resets at ${resetLabel}.`,
    );
    this.name = "GitHubRateLimitError";
    this.resetAt = options.resetAt;
    this.limit = options.limit;
    this.remaining = options.remaining;
  }
}

export class GitHubApiError extends GitHubFetcherError {
  readonly status: number;

  constructor(
    status: number,
    message: string,
    options?: { cause?: unknown },
  ) {
    super("API_ERROR", message, options);
    this.name = "GitHubApiError";
    this.status = status;
  }
}
