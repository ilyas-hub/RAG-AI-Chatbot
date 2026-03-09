/**
 * LLM Service — OpenRouter streaming via AI SDK streamText()
 *
 * Handles:
 * - Primary model streaming (OpenRouter / Llama)
 * - Fallback to secondary model on error
 * - Static fallback response on total failure
 *
 * Uses first-chunk validation: reads the first text chunk before piping
 * to the HTTP response. This catches async stream failures (e.g. provider
 * errors after 3 retries) that would otherwise bypass the fallback logic.
 */

import { streamText } from 'ai';
import type { ServerResponse } from 'http';
import { getOpenRouterModel } from '@/providers/openrouter';
import { logger } from '@/shared/utils/logger';
import type { ChatServiceConfig, ConversationMessage } from '../chatbot.types';

export interface LLMStreamResult {
  text: Promise<string>;
  usage: Promise<{ totalTokens?: number }>;
  pipeTextStreamToResponse: (res: ServerResponse, init?: ResponseInit) => void;
  modelUsed: string;
}

const RETRIABLE_STATUS_CODES = [429, 502, 503, 504];
const STREAM_TIMEOUT_MS = 30_000; // 30 seconds max for stream draining

export class LLMService {
  /**
   * Stream a chat response using AI SDK streamText.
   * Tries primary model, falls back to secondary on retriable or async errors.
   */
  async streamResponse(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    chatConfig: ChatServiceConfig,
    fallbackMessage: string = "I don't have enough information to answer that. You can reach our team through [Contact Us](/contact) for personalized help.",
  ): Promise<LLMStreamResult> {
    // Try primary model
    try {
      const result = await this.tryStreamWithValidation(
        chatConfig.primaryModel,
        systemPrompt,
        messages,
        chatConfig,
        'primary',
      );
      return result;
    } catch (primaryError: any) {
      const statusCode = primaryError?.status || primaryError?.statusCode;
      const isRetriable = !statusCode || RETRIABLE_STATUS_CODES.includes(statusCode);

      logger.chatbotError('primary_model_failed', primaryError.message, {
        model: chatConfig.primaryModel,
        statusCode,
        isRetriable,
      });

      if (!isRetriable) {
        // Non-retriable error with a known status code — return static fallback
        return this.createFallbackStream(fallbackMessage);
      }

      // Try fallback model
      try {
        const result = await this.tryStreamWithValidation(
          chatConfig.fallbackModel,
          systemPrompt,
          messages,
          chatConfig,
          'fallback',
        );
        return result;
      } catch (fallbackError: any) {
        logger.chatbotError('fallback_model_failed', fallbackError.message, {
          model: chatConfig.fallbackModel,
        });
        // Both models failed — return static fallback stream
        return this.createFallbackStream(fallbackMessage);
      }
    }
  }

  /**
   * Attempt to stream from a model with first-chunk validation.
   * Reads the first text chunk (which triggers the actual API call + retries).
   * If the first chunk succeeds, returns a validated LLMStreamResult.
   * If it throws, the error propagates to the caller for fallback handling.
   */
  private async tryStreamWithValidation(
    modelId: string,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    chatConfig: ChatServiceConfig,
    phase: 'primary' | 'fallback',
  ): Promise<LLMStreamResult> {
    const model = getOpenRouterModel(modelId);

    logger.chatbotStream('new', modelId, { phase });

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: chatConfig.temperature,
      maxOutputTokens: chatConfig.maxTokens,
      maxRetries: 0, // No retries — fallback model is our retry strategy
      onError: ({ error }) => {
        logger.chatbotError('stream_error', error instanceof Error ? error.message : String(error), {
          model: modelId,
          phase,
        });
      },
    });

    // Get the async iterator from the text stream
    const iterator = result.textStream[Symbol.asyncIterator]();

    // Read the first chunk — this triggers the actual API call.
    // If the provider fails (e.g. "Failed after 3 attempts"), it throws here.
    const firstChunk = await iterator.next();

    if (firstChunk.done) {
      // Stream ended immediately with no content — treat as failure
      throw new Error('Stream ended without producing any content');
    }

    // First chunk succeeded — build a validated stream result
    return this.createValidatedStream(firstChunk.value, iterator, result, modelId);
  }

  /**
   * Wraps a partially-consumed textStream iterator into a compliant LLMStreamResult.
   * The first chunk has already been read and validated.
   */
  private createValidatedStream(
    firstChunk: string,
    iterator: AsyncIterator<string>,
    sdkResult: ReturnType<typeof streamText>,
    modelId: string,
  ): LLMStreamResult {
    // Collect all text for the `text` promise
    let fullTextResolve: (text: string) => void;
    let fullTextReject: (err: Error) => void;
    const textPromise = new Promise<string>((resolve, reject) => {
      fullTextResolve = resolve;
      fullTextReject = reject;
    });

    return {
      modelUsed: modelId,

      text: textPromise,

      usage: sdkResult.usage.catch(() => ({ totalTokens: undefined })),

      pipeTextStreamToResponse: (res: ServerResponse) => {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
        });

        // Write the buffered first chunk
        res.write(firstChunk);

        let collected = firstChunk;

        // Drain remaining chunks with timeout
        (async () => {
          const timeout = setTimeout(() => {
            logger.chatbotError('stream_timeout', `Stream exceeded ${STREAM_TIMEOUT_MS}ms timeout`, { model: modelId });
            res.end();
            fullTextResolve(collected);
          }, STREAM_TIMEOUT_MS);

          try {
            while (true) {
              const { value, done } = await iterator.next();
              if (done) break;
              res.write(value);
              collected += value;
            }
            clearTimeout(timeout);
            res.end();
            fullTextResolve(collected);
          } catch (err) {
            clearTimeout(timeout);
            res.end();
            fullTextReject(err instanceof Error ? err : new Error(String(err)));
          }
        })();
      },
    };
  }

  /**
   * Creates a synthetic stream result that emits a static fallback message.
   * Used when all LLM providers are unavailable.
   */
  private createFallbackStream(message: string): LLMStreamResult {
    logger.chatbotError('static_fallback_sent', 'All LLM providers failed; returning fallback message');

    return {
      modelUsed: 'static_fallback',
      text: Promise.resolve(message),
      usage: Promise.resolve({ totalTokens: 0 }),
      pipeTextStreamToResponse: (res: ServerResponse) => {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
        });
        res.write(message);
        res.end();
      },
    };
  }

  /**
   * Map conversation messages to AI SDK format
   */
  formatMessages(
    history: ConversationMessage[],
    currentMessage: string
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const formatted = history.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    formatted.push({ role: 'user', content: currentMessage });
    return formatted;
  }
}

export const llmService = new LLMService();
