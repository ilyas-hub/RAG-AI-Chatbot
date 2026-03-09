/**
 * Ingestion Service — Document chunking + embedding pipeline
 *
 * Handles:
 * - Text chunking with overlap
 * - Embedding generation via OpenAI
 * - Pinecone upsert with metadata
 * - Content hash for deduplication
 */

import { createHash } from 'crypto';
import { upsertVectors, deleteVectors } from '@/providers/pinecone';
import type { PineconeVectorMetadata } from '@/providers/pinecone';
import { retrievalService } from './retrieval.service';
import { chatbotDb } from '../adapters/database.adapter';
import { logger } from '@/shared/utils/logger';

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 200;

export class IngestionService {
  /**
   * Chunk text into overlapping segments
   */
  chunkText(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_CHUNK_OVERLAP
  ): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        // Overlap: keep last part of current chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Generate a SHA-256 content hash for deduplication
   */
  hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Ingest a FAQ entry: embed and upsert to Pinecone
   */
  async ingestFaq(
    faqId: string,
    question: string,
    answer: string,
    options: { category?: string; knowledgeBaseId?: string } = {}
  ): Promise<string> {
    const text = `Q: ${question}\nA: ${answer}`;
    const embedding = await retrievalService.embedForStorage(text);

    const vectorId = `faq_${faqId}`;
    const metadata: PineconeVectorMetadata = {
      sourceType: 'faq',
      sourceId: faqId,
      knowledgeBaseId: options.knowledgeBaseId || '',
      category: options.category,
      title: question.slice(0, 100),
      text,
      createdAt: new Date().toISOString(),
    };

    await upsertVectors('global', [
      { id: vectorId, values: embedding, metadata },
    ]);

    // Update FAQ status in DB
    const prisma = chatbotDb.getClient();
    await prisma.faqContent.update({
      where: { id: faqId },
      data: {
        embeddingStatus: 'COMPLETED',
        pineconeVectorId: vectorId,
      },
    });

    logger.chatbot('faq_ingested', 'global', { faqId, vectorId });
    return vectorId;
  }

  /**
   * Ingest a document: chunk → embed → upsert to Pinecone
   */
  async ingestDocument(
    documentId: string,
    content: string,
    options: { title?: string; knowledgeBaseId?: string } = {}
  ): Promise<number> {
    const prisma = chatbotDb.getClient();

    // Mark as processing
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { embeddingStatus: 'PROCESSING' },
    });

    try {
      // Chunk the document
      const chunks = this.chunkText(content);

      // Embed all chunks in batch
      const embeddings = await retrievalService.embedBatch(chunks.map((c) => c));

      // Build vectors
      const vectors = chunks.map((chunk, i) => {
        const vectorId = `doc_${documentId}_chunk_${i}`;
        const metadata: PineconeVectorMetadata = {
          sourceType: 'document',
          sourceId: documentId,
          knowledgeBaseId: options.knowledgeBaseId || '',
          title: options.title,
          chunkIndex: i,
          totalChunks: chunks.length,
          text: chunk,
          createdAt: new Date().toISOString(),
        };
        return { id: vectorId, values: embeddings[i], metadata };
      });

      // Upsert to Pinecone (in batches of 100)
      for (let i = 0; i < vectors.length; i += 100) {
        const batch = vectors.slice(i, i + 100);
        await upsertVectors('global', batch);
      }

      // Update document status
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          embeddingStatus: 'COMPLETED',
          chunkCount: chunks.length,
          lastEmbeddedAt: new Date(),
          contentHash: this.hashContent(content),
        },
      });

      logger.chatbot('document_ingested', 'global', {
        documentId,
        chunkCount: chunks.length,
      });

      return chunks.length;
    } catch (error: any) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          embeddingStatus: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Remove a FAQ's vector from Pinecone
   */
  async removeFaqVector(pineconeVectorId: string): Promise<void> {
    await deleteVectors('global', [pineconeVectorId]);
    logger.chatbot('faq_vector_removed', 'global', { pineconeVectorId });
  }

  /**
   * Remove all vectors for a document from Pinecone
   */
  async removeDocumentVectors(
    documentId: string,
    chunkCount: number
  ): Promise<void> {
    const vectorIds = Array.from(
      { length: chunkCount },
      (_, i) => `doc_${documentId}_chunk_${i}`
    );
    await deleteVectors('global', vectorIds);
    logger.chatbot('document_vectors_removed', 'global', { documentId, vectorIds: vectorIds.length });
  }
}

export const ingestionService = new IngestionService();
