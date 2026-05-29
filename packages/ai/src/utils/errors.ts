export class LLMProviderError extends Error {
  readonly statusCode?: number;
  readonly provider: string;

  constructor(message: string, options: { provider: string; statusCode?: number; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = "LLMProviderError";
    this.provider = options.provider;
    this.statusCode = options.statusCode;
  }
}

export class SummaryParseError extends Error {
  readonly rawSnippet: string;

  constructor(message: string, rawSnippet: string) {
    super(message);
    this.name = "SummaryParseError";
    this.rawSnippet = rawSnippet;
  }
}

export class SummaryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SummaryValidationError";
  }
}
