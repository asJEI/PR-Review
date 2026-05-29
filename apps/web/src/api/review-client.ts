import type {
  CreateReviewRequest,
  CreateReviewResponse,
  ReviewStatus,
} from '@/types';

const API_BASE = '/api';

export class ReviewClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ReviewClientError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ReviewClientError(
      (errorData as { message?: string })?.message || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`${API_BASE}/healthz`);
}

/**
 * Create a new review
 */
export async function createReview(
  request: CreateReviewRequest
): Promise<CreateReviewResponse> {
  return fetchJson<CreateReviewResponse>(`${API_BASE}/reviews`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get review status and result
 */
export async function getReview(reviewId: string): Promise<ReviewStatus> {
  return fetchJson<ReviewStatus>(`${API_BASE}/reviews/${reviewId}`);
}

/**
 * Subscribe to SSE events for a review
 */
export function subscribeToEvents(
  reviewId: string,
  onEvent: (event: { phase?: string; progress?: { percent: number } }) => void,
  onError?: (error: Event) => void
): () => void {
  const eventSource = new EventSource(
    `${API_BASE}/reviews/${reviewId}/events`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch {
      // Ignore parse errors
    }
  };

  eventSource.onerror = (error) => {
    if (onError) {
      onError(error);
    }
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

/**
 * Validate GitHub PR URL
 */
export function isValidPrUrl(url: string): boolean {
  const pattern =
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/;
  return pattern.test(url.trim());
}

/**
 * Extract PR info from URL
 */
export function parsePrUrl(
  url: string
): { owner: string; repo: string; number: number } | null {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    number: parseInt(match[3], 10),
  };
}
