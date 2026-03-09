/**
 * Pinecone Vector Database Client
 *
 * Singleton client for Pinecone operations.
 * Uses a global "chatbot" namespace for platform-wide FAQ/KB vectors.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import type { PineconeVectorMetadata, PineconeQueryResult } from './pinecone.types';

let pineconeInstance: Pinecone | null = null;

/**
 * Get or create the Pinecone client singleton
 */
export function getPineconeClient(): Pinecone {
  if (pineconeInstance) {
    return pineconeInstance;
  }

  if (!config.pinecone.isConfigured) {
    logger.warn('Pinecone API key not configured — vector operations will fail');
  }

  pineconeInstance = new Pinecone({
    apiKey: config.pinecone.apiKey,
  });

  logger.info('Pinecone client initialized');
  return pineconeInstance;
}

/**
 * Get the chatbot index instance
 */
export function getChatbotIndex() {
  const client = getPineconeClient();
  return client.index(config.pinecone.indexName);
}

/**
 * Get the global chatbot namespace (platform-wide FAQ/KB).
 */
export function getGlobalNamespace() {
  return getChatbotIndex().namespace('chatbot');
}

/**
 * Upsert vectors into a namespace
 */
export async function upsertVectors(
  namespaceId: string,
  vectors: Array<{
    id: string;
    values: number[];
    metadata: PineconeVectorMetadata;
  }>
): Promise<void> {
  const ns = getGlobalNamespace();
  await ns.upsert(vectors as any);
  logger.debug(`Upserted ${vectors.length} vectors in namespace ${namespaceId}`);
}

/**
 * Query vectors in a namespace
 */
export async function queryVectors(
  namespaceId: string,
  queryVector: number[],
  topK: number = 10,
  filter?: Record<string, unknown>
): Promise<PineconeQueryResult[]> {
  const ns = getGlobalNamespace();
  const result = await ns.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });

  return (result.matches || []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: match.metadata as unknown as PineconeVectorMetadata,
  }));
}

/**
 * Delete vectors by IDs in a namespace
 */
export async function deleteVectors(
  namespaceId: string,
  vectorIds: string[]
): Promise<void> {
  if (vectorIds.length === 0) return;
  const ns = getGlobalNamespace();
  await ns.deleteMany(vectorIds);
  logger.debug(`Deleted ${vectorIds.length} vectors in namespace ${namespaceId}`);
}

/**
 * Delete all vectors in a namespace
 */
export async function deleteAllVectors(namespaceId: string): Promise<void> {
  const ns = getGlobalNamespace();
  await ns.deleteAll();
  logger.debug(`Deleted all vectors in namespace ${namespaceId}`);
}
