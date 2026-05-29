import type { ProviderId } from "@pr-review/shared";

export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  timeoutMs?: number;
}

export interface ResolvedProviderEnv {
  providerId: ProviderId;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

const PROVIDER_DEFAULTS: Record<
  Exclude<ProviderId, "mock">,
  { baseUrl: string; defaultModel: string; envKey: string; modelEnv: string; baseUrlEnv: string }
> = {
  openai: {
    envKey: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    modelEnv: "OPENAI_MODEL",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  deepseek: {
    envKey: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    modelEnv: "DEEPSEEK_MODEL",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  anthropic: {
    envKey: "ANTHROPIC_API_KEY",
    baseUrlEnv: "ANTHROPIC_BASE_URL",
    modelEnv: "ANTHROPIC_MODEL",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-20241022",
  },
};

export function resolveProviderEnv(env: NodeJS.ProcessEnv = process.env): ResolvedProviderEnv | null {
  const explicit = env.LLM_PROVIDER?.toLowerCase() as ProviderId | undefined;
  const timeoutMs = Number(env.LLM_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const maxRetries = Number(env.LLM_MAX_RETRIES ?? DEFAULT_MAX_RETRIES);
  const retryDelayMs = Number(env.LLM_RETRY_DELAY_MS ?? DEFAULT_RETRY_DELAY_MS);

  const order: Exclude<ProviderId, "mock">[] = explicit
    ? [explicit as Exclude<ProviderId, "mock">]
    : ["openai", "deepseek", "anthropic"];

  for (const providerId of order) {
    const defaults = PROVIDER_DEFAULTS[providerId];
    const apiKey = env[defaults.envKey];
    if (!apiKey) {
      if (explicit === providerId) {
        return null;
      }
      continue;
    }

    return {
      providerId,
      apiKey,
      baseUrl: env[defaults.baseUrlEnv] ?? defaults.baseUrl,
      defaultModel: env[defaults.modelEnv] ?? defaults.defaultModel,
      timeoutMs,
      maxRetries,
      retryDelayMs,
    };
  }

  return null;
}

export function toProviderConfig(resolved: ResolvedProviderEnv): ProviderConfig {
  return {
    id: resolved.providerId,
    apiKey: resolved.apiKey,
    baseUrl: resolved.baseUrl,
    defaultModel: resolved.defaultModel,
    timeoutMs: resolved.timeoutMs,
  };
}

export { PROVIDER_DEFAULTS };
