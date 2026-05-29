import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

import type { ReviewJobEvent, ReviewJobRecord, ReviewJobStatus, ServerProviderId } from "../types.js";

const jobsById = new Map<string, ReviewJobRecord>();
const latestJobIdByCacheKey = new Map<string, string>();
const listenersByJobId = new Map<string, Set<(event: ReviewJobEvent) => void>>();

const DEFAULT_PHASES = {
  summary: "pending",
  risk: "pending",
  comments: "pending",
} as const;

function cloneRecord(record: ReviewJobRecord): ReviewJobRecord {
  return JSON.parse(JSON.stringify(record)) as ReviewJobRecord;
}

function emit(jobId: string, event: ReviewJobEvent): void {
  const listeners = listenersByJobId.get(jobId);
  if (!listeners || listeners.size === 0) {
    return;
  }
  for (const listener of listeners) {
    listener(event);
  }
}

export function createCacheKey(input: { prUrl: string; provider: ServerProviderId; options?: unknown }): string {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(input));
  return hash.digest("hex");
}

export function createJob(input: {
  prUrl: string;
  cacheKey: string;
  provider: ServerProviderId;
  warnings?: string[];
}): ReviewJobRecord {
  const now = new Date().toISOString();
  const record: ReviewJobRecord = {
    id: randomUUID(),
    cacheKey: input.cacheKey,
    prUrl: input.prUrl,
    provider: input.provider,
    status: "queued",
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    progress: {
      percent: 0,
      phases: { ...DEFAULT_PHASES },
      lastEventAt: null,
    },
    warnings: input.warnings ?? [],
  };
  jobsById.set(record.id, record);
  latestJobIdByCacheKey.set(input.cacheKey, record.id);
  emit(record.id, { type: "snapshot", record: cloneRecord(record) });
  return cloneRecord(record);
}

export function getJob(jobId: string): ReviewJobRecord | null {
  const existing = jobsById.get(jobId);
  return existing ? cloneRecord(existing) : null;
}

export function findLatestByCacheKey(cacheKey: string): ReviewJobRecord | null {
  const jobId = latestJobIdByCacheKey.get(cacheKey);
  if (!jobId) {
    return null;
  }
  return getJob(jobId);
}

export function updateJobStatus(jobId: string, status: ReviewJobStatus): ReviewJobRecord {
  const record = jobsById.get(jobId);
  if (!record) {
    throw new Error(`Unknown job: ${jobId}`);
  }
  record.status = status;
  const now = new Date().toISOString();
  if (status === "running" && !record.startedAt) {
    record.startedAt = now;
  }
  if (status === "completed" || status === "failed") {
    record.finishedAt = now;
    record.progress.percent = 100;
  }
  emit(jobId, { type: "snapshot", record: cloneRecord(record) });
  return cloneRecord(record);
}

export function appendWarning(jobId: string, warning: string): void {
  const record = jobsById.get(jobId);
  if (!record) {
    return;
  }
  record.warnings.push(warning);
  emit(jobId, { type: "snapshot", record: cloneRecord(record) });
}

export function updateJobProgress(jobId: string, input: { agent: "summary" | "risk" | "comments"; phase: "started" | "completed" | "failed" }): void {
  const record = jobsById.get(jobId);
  if (!record) {
    return;
  }

  record.progress.lastEventAt = new Date().toISOString();
  if (input.phase === "started") {
    record.progress.phases[input.agent] = "running";
  } else if (input.phase === "completed") {
    record.progress.phases[input.agent] = "completed";
  } else {
    record.progress.phases[input.agent] = "failed";
  }

  const values = Object.values(record.progress.phases);
  const completed = values.filter((value) => value === "completed").length;
  const failed = values.filter((value) => value === "failed").length;
  record.progress.percent = Math.min(99, Math.round(((completed + failed) / 3) * 100));

  emit(jobId, { type: "snapshot", record: cloneRecord(record) });
}

export function setJobResult(jobId: string, result: ReviewJobRecord["result"]): void {
  const record = jobsById.get(jobId);
  if (!record) {
    return;
  }
  record.result = result;
  emit(jobId, { type: "snapshot", record: cloneRecord(record) });
}

export function setJobError(jobId: string, error: NonNullable<ReviewJobRecord["error"]>): void {
  const record = jobsById.get(jobId);
  if (!record) {
    return;
  }
  record.error = error;
  emit(jobId, { type: "snapshot", record: cloneRecord(record) });
}

export function subscribeJobEvents(jobId: string, listener: (event: ReviewJobEvent) => void): () => void {
  if (!listenersByJobId.has(jobId)) {
    listenersByJobId.set(jobId, new Set());
  }
  listenersByJobId.get(jobId)!.add(listener);
  return () => {
    const listeners = listenersByJobId.get(jobId);
    if (!listeners) {
      return;
    }
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByJobId.delete(jobId);
    }
  };
}

