export type LLMMessageRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  model: string;
  temperature?: number;
  responseFormat?: "json" | "text";
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage?: LLMUsage;
}

/** Provider-agnostic LLM abstraction for agent execution. */
export interface LLMProvider {
  readonly id: string;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}
