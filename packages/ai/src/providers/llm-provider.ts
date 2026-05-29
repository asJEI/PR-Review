export type LLMMessageRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

export interface ProviderCapabilities {
  jsonMode: boolean;
  streaming: boolean;
  toolCalling: boolean;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  model: string;
  temperature?: number;
  responseFormat?: "json" | "text";
  timeoutMs?: number;
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

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

/** Provider-agnostic LLM abstraction for agent execution. */
export interface LLMProvider {
  readonly id: string;
  readonly capabilities?: ProviderCapabilities;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
  stream?(request: LLMCompletionRequest): AsyncIterable<LLMStreamChunk>;
  completeWithTools?(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}

export const DEFAULT_PROVIDER_CAPABILITIES: ProviderCapabilities = {
  jsonMode: true,
  streaming: false,
  toolCalling: false,
};
