/**
 * OpenRouter AI SDK Provider
 *
 * Uses @ai-sdk/openai with OpenRouter's OpenAI-compatible baseURL.
 * Supports both chat completions and embeddings via a single API key.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';

let openRouterInstance: ReturnType<typeof createOpenAI> | null = null;

export function getOpenRouterProvider() {
  if (openRouterInstance) return openRouterInstance;

  const apiKey = config.openrouter.apiKey;
  const baseURL = config.cloudflare.isConfigured
    ? `${config.cloudflare.gatewayBaseUrl}/openrouter`
    : 'https://openrouter.ai/api/v1';

  openRouterInstance = createOpenAI({
    apiKey,
    baseURL,
    headers: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'RAG AI Chatbot',
    },
  });

  logger.info(`OpenRouter provider initialized (baseURL: ${baseURL})`);
  return openRouterInstance;
}

export function getOpenRouterModel(modelId: string) {
  // OpenRouter only supports the Chat Completions API, not the Responses API.
  // provider(modelId) defaults to Responses API in @ai-sdk/openai v2+.
  return getOpenRouterProvider().chat(modelId);
}
