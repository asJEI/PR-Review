import { OpenAICompatibleProvider } from "./openai-compatible-provider.js";
import type { LLMProvider } from "./llm-provider.js";
import { PROVIDER_DEFAULTS } from "./provider-config.js";

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }) {
    super({
      ...options,
      providerId: "openai",
      baseUrl: options.baseUrl ?? PROVIDER_DEFAULTS.openai.baseUrl,
      defaultModel: options.defaultModel ?? PROVIDER_DEFAULTS.openai.defaultModel,
    });
  }
}

export function createOpenAIProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): OpenAIProvider | null {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAIProvider({
    apiKey,
    baseUrl: env.OPENAI_BASE_URL,
    defaultModel: env.OPENAI_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS ? Number(env.LLM_TIMEOUT_MS) : undefined,
  });
}

export function createOpenAIProvider(config: {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}): LLMProvider {
  return new OpenAIProvider(config);
}
