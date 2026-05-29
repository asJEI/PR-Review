import { OpenAICompatibleProvider } from "./openai-compatible-provider.js";
import type { LLMProvider } from "./llm-provider.js";
import { PROVIDER_DEFAULTS } from "./provider-config.js";

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }) {
    super({
      ...options,
      providerId: "deepseek",
      baseUrl: options.baseUrl ?? PROVIDER_DEFAULTS.deepseek.baseUrl,
      defaultModel: options.defaultModel ?? PROVIDER_DEFAULTS.deepseek.defaultModel,
    });
  }
}

export function createDeepSeekProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): DeepSeekProvider | null {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new DeepSeekProvider({
    apiKey,
    baseUrl: env.DEEPSEEK_BASE_URL,
    defaultModel: env.DEEPSEEK_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS ? Number(env.LLM_TIMEOUT_MS) : undefined,
  });
}

export function createDeepSeekProvider(config: {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}): LLMProvider {
  return new DeepSeekProvider(config);
}
