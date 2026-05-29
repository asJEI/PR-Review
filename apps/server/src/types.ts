import type {
  ProviderId,
  ReviewExecutionOptions,
  ReviewExecutionReport,
  ReviewStreamEvent,
} from "@pr-review/ai";

export type ServerProviderId = ProviderId | "auto";

export interface ReviewRequestBody {
  prUrl: string;
  provider?: ServerProviderId;
  forceMock?: boolean;
  async?: boolean;
  options?: ReviewExecutionOptions & {
    maxRetries?: number;
    retryDelayMs?: number;
    model?: string;
    temperature?: number;
  };
}

export type ReviewJobStatus = "queued" | "running" | "completed" | "failed";

export interface ReviewJobProgress {
  percent: number;
  phases: Record<"summary" | "risk" | "comments", "pending" | "running" | "completed" | "failed">;
  lastEventAt: string | null;
}

export interface ReviewJobRecord {
  id: string;
  cacheKey: string;
  prUrl: string;
  provider: ServerProviderId;
  status: ReviewJobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  progress: ReviewJobProgress;
  result?: ReviewExecutionReport;
  error?: { message: string; code: string; details?: unknown };
  warnings: string[];
}

export interface ReviewJobEvent {
  type: "snapshot" | "stream" | "done";
  record: ReviewJobRecord;
  streamEvent?: ReviewStreamEvent;
}

