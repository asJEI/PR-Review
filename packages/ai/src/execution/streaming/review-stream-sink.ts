export type ReviewStreamAgent = "summary" | "risk" | "comments";

export type ReviewStreamPhase = "started" | "completed" | "failed";

export interface ReviewStreamEvent {
  agent: ReviewStreamAgent;
  phase: ReviewStreamPhase;
  partial?: unknown;
  error?: string;
}

export interface ReviewStreamSink {
  onEvent(event: ReviewStreamEvent): void | Promise<void>;
}

export class NoopReviewStreamSink implements ReviewStreamSink {
  onEvent(): void {
    // no-op
  }
}

export class CollectingReviewStreamSink implements ReviewStreamSink {
  readonly events: ReviewStreamEvent[] = [];

  onEvent(event: ReviewStreamEvent): void {
    this.events.push(event);
  }
}
