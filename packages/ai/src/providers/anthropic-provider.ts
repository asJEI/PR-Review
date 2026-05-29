import { LLMProviderError } from "../utils/errors.js";
import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMMessage,
  LLMProvider,
  ProviderCapabilities,
} from "./llm-provider.js";
import { DEFAULT_PROVIDER_CAPABILITIES } from "./llm-provider.js";
import { PROVIDER_DEFAULTS } from "./provider-config.js";

const JSON_SYSTEM_PROMPT =
  "You must respond with valid JSON only. Do not include markdown fences or explanatory text outside the JSON object.";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface AnthropicMessageResponse {
  model?: string;
  content?: Array<{ type?: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: { type?: string; message?: string };
}

function splitMessages(messages: LLMMessage[]): { system?: string; messages: LLMMessage[] } {
  const systemParts: string[] = [];
  const rest: LLMMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
    } else {
      rest.push(message);
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: rest,
  };
}

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  readonly capabilities: ProviderCapabilities = DEFAULT_PROVIDER_CAPABILITIES;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultTimeoutMs: number;

  constructor(options: AnthropicProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? PROVIDER_DEFAULTS.anthropic.baseUrl).replace(/\/$/, "");
    this.defaultModel = options.defaultModel ?? PROVIDER_DEFAULTS.anthropic.defaultModel;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.defaultTimeoutMs = options.timeoutMs ?? 60_000;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const { system, messages } = splitMessages(request.messages);
    const anthropicMessages = messages.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

    const systemPrompt =
      request.responseFormat === "json"
        ? [system, JSON_SYSTEM_PROMPT].filter(Boolean).join("\n\n")
        : system;

    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      max_tokens: 4096,
      messages: anthropicMessages,
      temperature: request.temperature ?? 0.2,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const signal = AbortSignal.timeout(timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
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

    const payload = (await response.json()) as AnthropicMessageResponse;

    if (!response.ok) {
      throw new LLMProviderError(payload.error?.message ?? `HTTP ${response.status}`, {
        provider: this.id,
        statusCode: response.status,
      });
    }

    const content = payload.content
      ?.filter((block) => block.type === "text" || block.text)
      .map((block) => block.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new LLMProviderError("Empty completion content from LLM provider", {
        provider: this.id,
        statusCode: response.status,
      });
    }

    const inputTokens = payload.usage?.input_tokens ?? 0;
    const outputTokens = payload.usage?.output_tokens ?? 0;

    return {
      content,
      model: payload.model ?? request.model,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  }
}

export function createAnthropicProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): AnthropicProvider | null {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new AnthropicProvider({
    apiKey,
    baseUrl: env.ANTHROPIC_BASE_URL,
    defaultModel: env.ANTHROPIC_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS ? Number(env.LLM_TIMEOUT_MS) : undefined,
  });
}

export function createAnthropicProvider(config: {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}): LLMProvider {
  return new AnthropicProvider(config);
}
