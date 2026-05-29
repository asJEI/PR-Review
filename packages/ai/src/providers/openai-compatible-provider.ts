import { LLMProviderError } from "../utils/errors.js";
import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProvider,
  ProviderCapabilities,
} from "./llm-provider.js";
import { DEFAULT_PROVIDER_CAPABILITIES } from "./llm-provider.js";

export interface OpenAICompatibleProviderOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  fetchImpl?: typeof fetch;
  providerId?: string;
  timeoutMs?: number;
}

interface OpenAIChatResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

export class OpenAICompatibleProvider implements LLMProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities = DEFAULT_PROVIDER_CAPABILITIES;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultTimeoutMs: number;

  constructor(options: OpenAICompatibleProviderOptions) {
    this.id = options.providerId ?? "openai-compatible";
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.defaultModel = options.defaultModel ?? "gpt-4o-mini";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.defaultTimeoutMs = options.timeoutMs ?? 60_000;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
    };

    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const signal = AbortSignal.timeout(timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new LLMProviderError("LLM request timed out", {
          provider: this.id,
          statusCode: 408,
          cause: error,
        });
      }
      throw new LLMProviderError("Network error calling LLM provider", {
        provider: this.id,
        cause: error,
      });
    }

    const payload = (await response.json()) as OpenAIChatResponse;

    if (!response.ok) {
      throw new LLMProviderError(payload.error?.message ?? `HTTP ${response.status}`, {
        provider: this.id,
        statusCode: response.status,
      });
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new LLMProviderError("Empty completion content from LLM provider", {
        provider: this.id,
        statusCode: response.status,
      });
    }

    return {
      content,
      model: payload.model ?? request.model,
      usage: payload.usage
        ? {
            promptTokens: payload.usage.prompt_tokens ?? 0,
            completionTokens: payload.usage.completion_tokens ?? 0,
            totalTokens: payload.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }
}

export function createOpenAICompatibleProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): OpenAICompatibleProvider | null {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAICompatibleProvider({
    apiKey,
    baseUrl: env.OPENAI_BASE_URL,
    defaultModel: env.OPENAI_MODEL,
    providerId: "openai",
    timeoutMs: env.LLM_TIMEOUT_MS ? Number(env.LLM_TIMEOUT_MS) : undefined,
  });
}
