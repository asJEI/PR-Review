import { describe, expect, it } from "vitest";

import { CollectingReviewStreamSink, NoopReviewStreamSink } from "./review-stream-sink.js";

describe("review-stream-sink", () => {
  it("noop sink accepts events without error", () => {
    const sink = new NoopReviewStreamSink();
    expect(() => sink.onEvent({ agent: "summary", phase: "started" })).not.toThrow();
  });

  it("collecting sink stores phase events", () => {
    const sink = new CollectingReviewStreamSink();
    sink.onEvent({ agent: "comments", phase: "started" });
    sink.onEvent({ agent: "comments", phase: "completed" });

    expect(sink.events).toHaveLength(2);
    expect(sink.events[0]!.agent).toBe("comments");
  });
});
