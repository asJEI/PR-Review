import type { LLMProvider } from "./llm-provider.js";

export function getBaseProviderId(provider: LLMProvider): string {
  return provider.id.replace(/(?:-with-(?:retry|timeout))+$/g, "");
}

export function isWrappedProvider(provider: LLMProvider): boolean {
  return provider.id.includes("-with-");
}
