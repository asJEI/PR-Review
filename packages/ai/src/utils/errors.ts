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

export class RiskParseError extends Error {
  readonly rawSnippet: string;

  constructor(message: string, rawSnippet: string) {
    super(message);
    this.name = "RiskParseError";
    this.rawSnippet = rawSnippet;
  }
}

export class RiskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiskValidationError";
  }
}

export class CommentParseError extends Error {
  readonly rawSnippet: string;

  constructor(message: string, rawSnippet: string) {
    super(message);
    this.name = "CommentParseError";
    this.rawSnippet = rawSnippet;
  }
}

export class CommentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentValidationError";
  }
}

export class ReviewExecutionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewExecutionValidationError";
  }
}

export class StructuredOutputError extends Error {
  readonly rawSnippet: string;
  readonly validationErrors: string[];

  constructor(message: string, rawSnippet: string, validationErrors: string[] = []) {
    super(message);
    this.name = "StructuredOutputError";
    this.rawSnippet = rawSnippet;
    this.validationErrors = validationErrors;
  }
}
