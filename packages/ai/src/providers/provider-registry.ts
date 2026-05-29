import type { ProviderId } from "@pr-review/shared";

import { createAnthropicProvider } from "./anthropic-provider.js";
import { createDeepSeekProvider } from "./deepseek-provider.js";
import type { LLMProvider } from "./llm-provider.js";
import { createOpenAIProvider } from "./openai-provider.js";
import {
  resolveProviderEnv,
  toProviderConfig,
  type ProviderConfig,
} from "./provider-config.js";
import { withRetry } from "./with-retry.js";
import { withTimeout } from "./with-timeout.js";

export type ProviderFactory = (config: ProviderConfig) => LLMProvider;

const registry = new Map<ProviderId, ProviderFactory>();

export function registerProvider(id: ProviderId, factory: ProviderFactory): void {
  registry.set(id, factory);
}

export function listProviders(): ProviderId[] {
  return [...registry.keys()];
}

export function createProvider(config: ProviderConfig): LLMProvider {
  const factory = registry.get(config.id);
  if (!factory) {
    throw new Error(`Unknown provider id: ${config.id}`);
  }

  const provider = factory(config);
  const withTimeoutProvider = withTimeout(provider, { timeoutMs: config.timeoutMs });
  return withRetry(withTimeoutProvider);
}

export function resolveProviderFromEnv(env: NodeJS.ProcessEnv = process.env): LLMProvider | null {
  const resolved = resolveProviderEnv(env);
  if (!resolved) {
    return null;
  }
  return createProvider(toProviderConfig(resolved));
}

registerProvider("openai", (config) =>
  createOpenAIProvider({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    timeoutMs: config.timeoutMs,
  }),
);

registerProvider("deepseek", (config) =>
  createDeepSeekProvider({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    timeoutMs: config.timeoutMs,
  }),
);

registerProvider("anthropic", (config) =>
  createAnthropicProvider({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    timeoutMs: config.timeoutMs,
  }),
);
