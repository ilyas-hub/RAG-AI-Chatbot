/**
 * Retrieval Service — Embed query -> Pinecone search -> Filter -> Context assembly
 *
 * Implements the RAG (Retrieval-Augmented Generation) retrieval pipeline:
 * 1. Embed user query via OpenRouter (openai/text-embedding-3-small)
 * 2. Query Pinecone top-K=10 from global namespace
 * 3. Score threshold filter: discard < 0.72
 * 4. Take top 5 passing results
 * 5. Return assembled context block
 */

import { createHash } from 'crypto';
import { config } from '@/config';
import { queryVectors } from '@/providers/pinecone';
import { logger } from '@/shared/utils/logger';
import type { RetrievalResult, RetrievedChunk } from '../chatbot.types';

/**
 * Simple LRU embedding cache to avoid re-embedding identical queries.
 * Key: SHA-256 hash of the query text. Value: { embedding, timestamp }.
 */
const EMBEDDING_CACHE_MAX_SIZE = 200;
const EMBEDDING_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const embeddingCache = new Map<string, { embedding: number[]; cachedAt: number }>();

function getCachedEmbedding(text: string): number[] | null {
  const key = createHash('sha256').update(text).digest('hex');
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > EMBEDDING_CACHE_TTL_MS) {
    embeddingCache.delete(key);
    return null;
  }
  return entry.embedding;
}

function setCachedEmbedding(text: string, embedding: number[]): void {
  const key = createHash('sha256').update(text).digest('hex');

  // Evict oldest entries if at capacity
  if (embeddingCache.size >= EMBEDDING_CACHE_MAX_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }

  embeddingCache.set(key, { embedding, cachedAt: Date.now() });
}

/**
 * Embed text via OpenRouter (routes to openai/text-embedding-3-small).
 */
async function embedText(text: string): Promise<number[]> {
  // Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) return cached;

  const url = config.cloudflare.isConfigured
    ? `${config.cloudflare.gatewayBaseUrl}/openrouter/embeddings`
    : 'https://openrouter.ai/api/v1/embeddings';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.chatbot.embeddingModel,
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter embedding failed (${response.status}): ${err}`);
  }

  const data: any = await response.json();
  const embedding = data.data[0].embedding;

  setCachedEmbedding(text, embedding);
  return embedding;
}

export class RetrievalService {
  /**
   * Retrieve relevant context for a user query from Pinecone
   */
  async retrieve(query: string): Promise<RetrievalResult> {
    const startTime = Date.now();

    // 1. Embed the user query
    const queryEmbedding = await embedText(query);

    // 2. Query Pinecone with top-K from global namespace
    const rawResults = await queryVectors('global', queryEmbedding, 10);

    // 3. Score threshold filter
    const threshold = config.chatbot.scoreThreshold;
    const filtered = rawResults.filter((r) => r.score >= threshold);

    // 4. Take top N passing results
    const maxChunks = config.chatbot.maxContextChunks;
    const topResults = filtered.slice(0, maxChunks);

    // 5. Map to RetrievedChunk
    const chunks: RetrievedChunk[] = topResults.map((r) => ({
      id: r.id,
      text: r.metadata.text,
      score: r.score,
      sourceType: r.metadata.sourceType,
      sourceId: r.metadata.sourceId,
      title: r.metadata.title,
      category: r.metadata.category,
    }));

    const durationMs = Date.now() - startTime;
    logger.chatbotRetrieval('global', chunks.length, durationMs, {
      totalRaw: rawResults.length,
      passedThreshold: filtered.length,
    });

    return { chunks, queryEmbedding };
  }

  /**
   * Embed a text for storage (FAQ or document chunk)
   */
  async embedForStorage(text: string): Promise<number[]> {
    return embedText(text);
  }

  /**
   * Embed multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const url = config.cloudflare.isConfigured
      ? `${config.cloudflare.gatewayBaseUrl}/openrouter/embeddings`
      : 'https://openrouter.ai/api/v1/embeddings';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.chatbot.embeddingModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter batch embedding failed (${response.status}): ${err}`);
    }

    const data: any = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }
}

export const retrievalService = new RetrievalService();
