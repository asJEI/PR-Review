export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof Error) {
    const anyError = error as {
      status?: number;
      statusCode?: number;
      code?: string;
      name?: string;
    };

    const status = anyError.status ?? anyError.statusCode;
    if (typeof status === "number") {
      const normalized = Math.max(400, Math.min(599, status));
      return new HttpError(normalized, anyError.code ?? "UPSTREAM_ERROR", error.message);
    }

    if (anyError.name?.includes("Validation")) {
      return new HttpError(400, anyError.code ?? "VALIDATION_ERROR", error.message);
    }

    if (anyError.name?.includes("RateLimit")) {
      return new HttpError(429, anyError.code ?? "RATE_LIMIT", error.message);
    }

    if (anyError.name?.includes("NotFound")) {
      return new HttpError(404, anyError.code ?? "NOT_FOUND", error.message);
    }

    return new HttpError(500, anyError.code ?? "INTERNAL_ERROR", error.message);
  }

  return new HttpError(500, "INTERNAL_ERROR", "Unknown server error");
}

