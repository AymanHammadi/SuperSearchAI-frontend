export type LLMProvider = "openrouter";

export const providerLabels: Record<LLMProvider, string> = {
  openrouter: "OpenRouter",
};

export function getApiKey(provider: LLMProvider): string | null {
  return localStorage.getItem(`apiKey_${provider}`);
}

export function setApiKey(provider: LLMProvider, apiKey: string): void {
  localStorage.setItem(`apiKey_${provider}`, apiKey);
}

export function deleteApiKey(provider: LLMProvider): void {
  localStorage.removeItem(`apiKey_${provider}`);
}

export function hasApiKey(provider: LLMProvider): boolean {
  const key = getApiKey(provider);
  return key !== null && key.trim() !== "";
}

export function getAllApiKeys(): Record<LLMProvider, string | null> {
  const keys = {} as Record<LLMProvider, string | null>;
  Object.keys(providerLabels).forEach(provider => {
    keys[provider as LLMProvider] = getApiKey(provider as LLMProvider);
  });
  return keys;
}
