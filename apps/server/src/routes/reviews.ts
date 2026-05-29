import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import type { ReviewRequestBody } from "../types.js";
import { HttpError, normalizeError } from "../utils/http-error.js";
import {
  appendWarning,
  createJob,
  findLatestByCacheKey,
  getJob,
  setJobError,
  setJobResult,
  setJobArtifacts,
  updateJobStatus,
  subscribeJobEvents,
  createCacheKey,
} from "../services/review-jobs.js";
import { runReviewPipeline } from "../services/run-review.js";

function setJsonHeaders(res: ServerResponse, status = 200): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("error", reject);
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new HttpError(400, "INVALID_JSON", "Request body must be valid JSON"));
      }
    });
  });
}

function assertReviewBody(payload: unknown): ReviewRequestBody {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "INVALID_BODY", "Body must be an object");
  }
  const body = payload as Partial<ReviewRequestBody>;
  if (!body.prUrl || typeof body.prUrl !== "string" || !body.prUrl.trim()) {
    throw new HttpError(400, "INVALID_PR_URL", "prUrl is required");
  }
  return {
    prUrl: body.prUrl.trim(),
    provider: body.provider,
    forceMock: body.forceMock,
    async: body.async,
    skipCache: body.skipCache,
    options: body.options,
  };
}

function writeError(res: ServerResponse, error: unknown): void {
  const normalized = normalizeError(error);
  setJsonHeaders(res, normalized.status);
  res.end(
    JSON.stringify(
      {
        ok: false,
        error: {
          code: normalized.code,
          message: normalized.message,
          details: normalized.details,
        },
      },
      null,
      2,
    ),
  );
}

async function handleCreateReview(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const payload = await readJsonBody(req);
  const body = assertReviewBody(payload);
  const provider = body.provider ?? "auto";
  const cacheKey = createCacheKey({
    prUrl: body.prUrl,
    provider,
    options: body.options ?? {},
  });

  const latest = findLatestByCacheKey(cacheKey);
  if (!body.skipCache && latest && latest.status === "completed") {
    setJsonHeaders(res, 200);
    res.end(
      JSON.stringify(
        {
          ok: true,
          cached: true,
          reviewId: latest.id,
          status: latest.status,
          result: latest.result,
          artifacts: latest.artifacts,
          progress: latest.progress,
          warnings: latest.warnings,
        },
        null,
        2,
      ),
    );
    return;
  }

  const job = createJob({
    prUrl: body.prUrl,
    cacheKey,
    provider,
  });

  const run = async () => {
    try {
      updateJobStatus(job.id, "running");
      const result = await runReviewPipeline(body, job.id);
      for (const warning of result.warnings) {
        appendWarning(job.id, warning);
      }
      setJobResult(job.id, result.report);
      setJobArtifacts(job.id, result.artifacts);
      updateJobStatus(job.id, "completed");
      return getJob(job.id);
    } catch (error) {
      const normalized = normalizeError(error);
      setJobError(job.id, {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      });
      updateJobStatus(job.id, "failed");
      throw normalized;
    }
  };

  if (body.async ?? true) {
    void run().catch(() => {
      // Errors are already normalized and persisted to the job record.
      // Keep process alive for async polling clients.
    });
    setJsonHeaders(res, 202);
    res.end(
      JSON.stringify(
        {
          ok: true,
          reviewId: job.id,
          status: "queued",
          progress: job.progress,
        },
        null,
        2,
      ),
    );
    return;
  }

  const finalRecord = await run();
  setJsonHeaders(res, 200);
  res.end(
    JSON.stringify(
      {
        ok: true,
        reviewId: finalRecord?.id,
        status: finalRecord?.status,
        result: finalRecord?.result,
        artifacts: finalRecord?.artifacts,
        progress: finalRecord?.progress,
        warnings: finalRecord?.warnings ?? [],
      },
      null,
      2,
    ),
  );
}

function handleGetReview(res: ServerResponse, reviewId: string): void {
  const record = getJob(reviewId);
  if (!record) {
    throw new HttpError(404, "REVIEW_NOT_FOUND", `Unknown review id: ${reviewId}`);
  }
  setJsonHeaders(res, 200);
  res.end(
    JSON.stringify(
      {
        ok: true,
        reviewId: record.id,
        status: record.status,
        progress: record.progress,
        result: record.result,
        artifacts: record.artifacts,
        error: record.error,
        warnings: record.warnings,
      },
      null,
      2,
    ),
  );
}

function handleReviewEvents(req: IncomingMessage, res: ServerResponse, reviewId: string): void {
  const record = getJob(reviewId);
  if (!record) {
    throw new HttpError(404, "REVIEW_NOT_FOUND", `Unknown review id: ${reviewId}`);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, payload: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send("snapshot", record);
  const unsubscribe = subscribeJobEvents(reviewId, (event) => {
    send(event.type, event.record);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
}

export function createReviewsServer() {
  return createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        throw new HttpError(400, "INVALID_REQUEST", "Missing request url or method");
      }

      const url = new URL(req.url, "http://localhost");
      const pathname = url.pathname;

      if (req.method === "POST" && pathname === "/api/reviews") {
        await handleCreateReview(req, res);
        return;
      }

      const reviewMatch = pathname.match(/^\/api\/reviews\/([^/]+)$/);
      if (req.method === "GET" && reviewMatch) {
        handleGetReview(res, reviewMatch[1]!);
        return;
      }

      const eventsMatch = pathname.match(/^\/api\/reviews\/([^/]+)\/events$/);
      if (req.method === "GET" && eventsMatch) {
        handleReviewEvents(req, res, eventsMatch[1]!);
        return;
      }

      if (req.method === "GET" && pathname === "/api/healthz") {
        setJsonHeaders(res, 200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      throw new HttpError(404, "NOT_FOUND", `Route not found: ${req.method} ${pathname}`);
    } catch (error) {
      writeError(res, error);
    }
  });
}

